import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's Supabase ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { leads, fileName } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Invalid leads data' }, { status: 400 });
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('lead_imports')
      .insert({
        file_name: fileName || 'unknown.csv',
        import_source: 'CSV',
        total_rows: leads.length,
        imported_by: user.id,
        status: 'processing',
      })
      .select()
      .single();

    if (importError) {
      console.error('Error creating import record:', importError);
      return NextResponse.json({ error: 'Failed to create import record' }, { status: 500 });
    }

    let successful = 0;
    let failed = 0;
    let duplicates = 0;
    const errors: string[] = [];

    // Process each lead
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      try {
        // Debug: Log the lead object to see what we're receiving
        console.log(`Processing lead ${i + 1}:`, JSON.stringify({
          email: lead.email,
          category: lead.category,
          has_category: !!lead.category
        }));

        // Validate required fields (check all possible variations)
        const firstName = lead.first_name || lead.firstName || lead['First Name'];
        const lastName = lead.last_name || lead.lastName || lead['Last Name'];
        const email = lead.email || lead.Email;
        const phone = lead.phone || lead.Phone || lead.phone_number || lead.phoneNumber;

        // Only require email or phone (first_name and last_name are optional)
        if (!email && !phone) {
          failed++;
          errors.push(`Row ${i + 1}: Missing email or phone (at least one required)`);
          continue;
        }

        // Check for duplicates
        let duplicateQuery = supabase.from('leads').select('id');

        if (email) {
          duplicateQuery = duplicateQuery.eq('email', email);
        } else if (phone) {
          duplicateQuery = duplicateQuery.eq('phone', phone);
        }

        const { data: existingLead } = await duplicateQuery.single();

        if (existingLead) {
          duplicates++;

          // Build update object with ALL new non-empty fields from import
          const updateData: any = {};
          const updatedFields: string[] = [];

          // Map all possible fields and only include if they have a value
          const fieldMappings: Record<string, () => any> = {
            first_name: () => lead.first_name || lead.firstName || lead['First Name'],
            last_name: () => lead.last_name || lead.lastName || lead['Last Name'],
            email: () => lead.email || lead.Email,
            phone: () => lead.phone || lead.Phone || lead.phone_number || lead.phoneNumber,
            company: () => lead.company || lead.Company,
            job_title: () => lead.job_title || lead.jobTitle || lead['Job Title'],
            website: () => lead.website || lead.Website,
            linkedin_url: () => lead.linkedin_url || lead.linkedinUrl || lead['LinkedIn'],
            address: () => lead.address || lead.Address,
            city: () => lead.city || lead.City,
            state: () => lead.state || lead.State,
            postal_code: () => lead.postal_code || lead.postalCode || lead.zip,
            country: () => lead.country || lead.Country,
            industry: () => lead.industry || lead.Industry,
            company_size: () => lead.company_size || lead.companySize || lead.employees,
            annual_revenue: () => lead.annual_revenue || lead.annualRevenue || lead.revenue,
            notes: () => lead.notes || lead.Notes || lead.comments,
            category: () => lead.category || lead.Category,
            lead_source: () => lead.lead_source || lead.source || lead.Source,
            lead_source_details: () => lead.lead_source_details || fileName,
          };

          // Check each field and add to update if it has a non-empty value
          for (const [fieldName, getter] of Object.entries(fieldMappings)) {
            const value = getter();
            if (value !== null && value !== undefined && value !== '') {
              updateData[fieldName] = value;
              updatedFields.push(fieldName);
            }
          }

          // Only update if we have new data
          if (Object.keys(updateData).length > 0) {
            console.log(`Updating duplicate lead ${existingLead.id} with fields:`, updatedFields.join(', '));

            const { error: updateError } = await supabase
              .from('leads')
              .update(updateData)
              .eq('id', existingLead.id);

            if (updateError) {
              console.error('Error updating duplicate lead:', updateError);
              errors.push(`Row ${i + 1}: Failed to update duplicate - ${updateError.message}`);
            } else {
              console.log(`Successfully updated ${updatedFields.length} fields for duplicate lead`);
            }
          } else {
            console.log('No new data to update for duplicate lead');
          }

          continue;
        }

        // Map common field variations to database columns
        const mappedLead: any = {
          first_name: lead.first_name || lead.firstName || lead['First Name'] || '',
          last_name: lead.last_name || lead.lastName || lead['Last Name'] || '',
          email: lead.email || lead.Email,
          phone: lead.phone || lead.Phone || lead.phone_number || lead.phoneNumber,
          company: lead.company || lead.Company,
          job_title: lead.job_title || lead.jobTitle || lead['Job Title'],
          website: lead.website || lead.Website,
          linkedin_url: lead.linkedin_url || lead.linkedinUrl || lead['LinkedIn'],
          lead_source: lead.lead_source || lead.source || lead.Source || 'CSV Import',
          lead_source_details: lead.lead_source_details || fileName || 'CSV Import',
          category: lead.category, // Add category field
          assigned_to: user.id,
          import_id: importRecord.id,
          import_row_number: i + 1,
          status: 'new',
        };

        // Remove undefined values
        Object.keys(mappedLead).forEach(key => {
          if (mappedLead[key] === undefined) {
            delete mappedLead[key];
          }
        });

        // Insert lead
        const { error: insertError } = await supabase.from('leads').insert(mappedLead);

        if (insertError) {
          failed++;
          errors.push(`Row ${i + 1}: ${insertError.message}`);
        } else {
          successful++;
        }
      } catch (error: any) {
        failed++;
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    // Update import record
    await supabase
      .from('lead_imports')
      .update({
        status: 'completed',
        successful_imports: successful,
        failed_imports: failed,
        duplicate_skipped: duplicates,
        completed_at: new Date().toISOString(),
        error_log: errors.length > 0 ? errors : null,
      })
      .eq('id', importRecord.id);

    return NextResponse.json({
      successful,
      failed,
      duplicates,
      errors: errors.slice(0, 20), // Limit errors in response
      importId: importRecord.id,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import leads' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
