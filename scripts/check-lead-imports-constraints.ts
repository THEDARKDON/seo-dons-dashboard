import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log('🔍 Checking lead_imports NOT NULL constraints...\n');

  // The error shows which columns are NOT NULL
  // From error: file_name is NOT NULL and we're passing null

  console.log('📋 Columns being inserted by API:');
  console.log('  • imported_by: UUID ✅');
  console.log('  • assigned_to: UUID (nullable) ✅');
  console.log('  • import_source: text ✅');
  console.log('  • total_rows: integer ✅');
  console.log('  • status: text ✅');
  console.log('  • settings: jsonb ✅\n');

  console.log('❌ PROBLEM: file_name column has NOT NULL constraint\n');

  console.log('💡 SOLUTIONS:\n');
  console.log('Option 1: Make file_name nullable (RECOMMENDED)');
  console.log('   ALTER TABLE lead_imports ALTER COLUMN file_name DROP NOT NULL;\n');

  console.log('Option 2: Provide a default value in the API');
  console.log('   file_name: body.fileName || \'Manual Import\'\n');

  console.log('Option 3: Add a default value to the column');
  console.log('   ALTER TABLE lead_imports ALTER COLUMN file_name SET DEFAULT \'Unnamed Import\';\n');
}

checkConstraints();
