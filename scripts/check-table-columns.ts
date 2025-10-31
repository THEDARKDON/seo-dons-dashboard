import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('🔍 Checking lead_imports table structure...\n');

  try {
    // Try to fetch with all expected columns
    const { data, error } = await supabase
      .from('lead_imports')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error fetching from lead_imports:');
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);

      // Try fetching with specific columns
      console.log('\n🔍 Trying with specific columns...');
      const { data: testData, error: testError } = await supabase
        .from('lead_imports')
        .select('id, imported_by, import_type, total_rows')
        .limit(1);

      if (testError) {
        console.log('   ❌ Error:', testError.message);
      } else {
        console.log('   ✅ Basic columns work!');
        console.log('   Data:', testData);
      }

      // Try with assigned_to specifically
      console.log('\n🔍 Trying with assigned_to column...');
      const { data: assignedData, error: assignedError } = await supabase
        .from('lead_imports')
        .select('id, assigned_to')
        .limit(1);

      if (assignedError) {
        console.log('   ❌ Error with assigned_to:', assignedError.message);
        console.log('\n⚠️ DIAGNOSIS: The assigned_to column is MISSING from the lead_imports table!');
        console.log('\n📝 TO FIX: Run the APPLY_LEAD_IMPORT_MIGRATION.sql script');
      } else {
        console.log('   ✅ assigned_to column exists!');
        console.log('   Data:', assignedData);
      }
    } else {
      console.log('✅ Successfully fetched from lead_imports!');
      console.log('Columns available:', data && data[0] ? Object.keys(data[0]) : 'No data');
    }

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkColumns();
