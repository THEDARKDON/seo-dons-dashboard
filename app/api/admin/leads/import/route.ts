import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/leads/import - Import leads for a specific SDR
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verify admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { leads, assignedToUserId, importType = 'manual', settings = {} } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 });
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('lead_imports')
      .insert({
        imported_by: adminUser.id,
        assigned_to: assignedToUserId,
        import_source: importType, // Note: column is 'import_source' not 'import_type'
        total_rows: leads.length,
        status: 'processing',
        settings,
      })
      .select()
      .single();

    if (importError || !importRecord) {
      console.error('Error creating import record:', importError);
      return NextResponse.json({ error: 'Failed to create import record' }, { status: 500 });
    }

    // Process each lead
    const results = [];
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const leadData = leads[i];

      try {
        // Check for duplicate by email if provided
        let isDuplicate = false;
        if (leadData.email && settings.skipDuplicates) {
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('email', leadData.email)
            .single();

          if (existing) {
            isDuplicate = true;
            duplicateCount++;

            await supabase.from('lead_import_results').insert({
              import_id: importRecord.id,
              row_number: i + 1,
              raw_data: leadData,
              status: 'duplicate',
              error_message: 'Email already exists',
            });

            results.push({ row: i + 1, status: 'duplicate', email: leadData.email });
            continue;
          }
        }

        // Insert lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            ...leadData,
            assigned_to: assignedToUserId,
            assigned_at: new Date().toISOString(),
            import_id: importRecord.id,
            imported_at: new Date().toISOString(),
            lead_source: importType === 'csv' ? 'CSV Import' : 'Manual Entry',
            lead_source_details: `Imported by admin`,
          })
          .select()
          .single();

        if (leadError) {
          failCount++;
          await supabase.from('lead_import_results').insert({
            import_id: importRecord.id,
            row_number: i + 1,
            raw_data: leadData,
            status: 'failed',
            error_message: leadError.message,
          });

          results.push({ row: i + 1, status: 'failed', error: leadError.message });
        } else {
          successCount++;
          await supabase.from('lead_import_results').insert({
            import_id: importRecord.id,
            lead_id: newLead.id,
            row_number: i + 1,
            raw_data: leadData,
            status: 'success',
          });

          results.push({ row: i + 1, status: 'success', leadId: newLead.id });
        }
      } catch (error: any) {
        failCount++;
        await supabase.from('lead_import_results').insert({
          import_id: importRecord.id,
          row_number: i + 1,
          raw_data: leadData,
          status: 'failed',
          error_message: error.message,
        });

        results.push({ row: i + 1, status: 'failed', error: error.message });
      }
    }

    // Update import record with final status
    await supabase
      .from('lead_imports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', importRecord.id);

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      summary: {
        total: leads.length,
        successful: successCount,
        failed: failCount,
        duplicates: duplicateCount,
      },
      results,
    });
  } catch (error: any) {
    console.error('Error importing leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import leads' },
      { status: 500 }
    );
  }
}

// GET /api/admin/leads/import - Get import history
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verify admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const assignedTo = searchParams.get('assignedTo');

    let query = supabase
      .from('lead_imports')
      .select(`
        *,
        imported_by_user:users!lead_imports_imported_by_fkey(id, first_name, last_name),
        assigned_to_user:users!lead_imports_assigned_to_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data: imports, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ imports });
  } catch (error: any) {
    console.error('Error fetching import history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch import history' },
      { status: 500 }
    );
  }
}
