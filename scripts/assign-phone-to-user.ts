// Quick script to assign Twilio number to your user
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignPhoneNumber() {
  console.log('📞 Assigning Twilio number to user...\n');

  // Get the first admin user
  const { data: adminUser, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (userError || !adminUser) {
    console.error('❌ Error finding admin user:', userError);
    return;
  }

  console.log(`✅ Found admin user: ${adminUser.email}\n`);

  // Check if user_voip_settings table exists, if not create it
  const { data: existingSettings } = await supabase
    .from('user_voip_settings')
    .select('*')
    .eq('user_id', adminUser.id)
    .single();

  if (existingSettings) {
    console.log('⚠️  User already has VoIP settings. Updating...\n');

    const { error: updateError } = await supabase
      .from('user_voip_settings')
      .update({
        assigned_phone_number: '+447700158258',
        caller_id_number: '+447700158258',
        auto_record: true,
        auto_transcribe: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', adminUser.id);

    if (updateError) {
      console.error('❌ Error updating settings:', updateError);
    } else {
      console.log('✅ Updated VoIP settings successfully!\n');
    }
  } else {
    console.log('Creating new VoIP settings...\n');

    const { error: insertError } = await supabase
      .from('user_voip_settings')
      .insert({
        user_id: adminUser.id,
        assigned_phone_number: '+447700158258',
        caller_id_number: '+447700158258',
        auto_record: true,
        auto_transcribe: true,
      });

    if (insertError) {
      console.error('❌ Error inserting settings:', insertError);
      console.log('\n⚠️  The user_voip_settings table might not exist.');
      console.log('Please run the SQL migration in Supabase SQL Editor first.\n');
    } else {
      console.log('✅ Created VoIP settings successfully!\n');
    }
  }

  // Verify the assignment
  const { data: verifySettings } = await supabase
    .from('user_voip_settings')
    .select('*')
    .eq('user_id', adminUser.id)
    .single();

  if (verifySettings) {
    console.log('📋 Current Settings:');
    console.log(`   User: ${adminUser.email}`);
    console.log(`   Phone: ${verifySettings.assigned_phone_number}`);
    console.log(`   Caller ID: ${verifySettings.caller_id_number}`);
    console.log(`   Auto Record: ${verifySettings.auto_record}`);
    console.log(`   Auto Transcribe: ${verifySettings.auto_transcribe}\n`);
    console.log('✅ All set! You can now make calls from the dashboard.\n');
  }
}

assignPhoneNumber().catch(console.error);
