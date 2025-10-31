import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying lead import migration...\n');

  try {
    // Check if lead_imports table exists
    console.log('1️⃣ Checking if lead_imports table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('lead_imports')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.message.includes('relation "public.lead_imports" does not exist')) {
        console.log('   ❌ lead_imports table does NOT exist');
        console.log('   📝 Need to run migration SQL manually\n');
      } else if (tableError.code === 'PGRST204') {
        console.log('   ❌ Schema cache issue - table might exist but columns are wrong');
        console.log('   📝 Need to run migration SQL manually\n');
      } else {
        console.log('   ⚠️ Error:', tableError.message);
      }
    } else {
      console.log('   ✅ lead_imports table exists!\n');
    }

    // Read the migration file
    console.log('2️⃣ Reading migration file...');
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '023_lead_import_system.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('   ❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('   ✅ Migration file loaded\n');

    console.log('📋 INSTRUCTIONS TO APPLY MIGRATION:\n');
    console.log('Since Supabase REST API cannot run DDL statements directly,');
    console.log('you need to run this SQL manually in the Supabase SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new');
    console.log('2. Copy and paste the contents of: APPLY_LEAD_IMPORT_MIGRATION.sql');
    console.log('3. Click "Run" to execute\n');

    console.log('Or run this command if you have psql installed:');
    console.log('psql "postgresql://postgres.hfkfucslnalrltsnsvws:PASSWORD@aws-0-eu-west-2.pooler.supabase.com:6543/postgres" -f "d:\\LeaderBoard and Audit Site\\APPLY_LEAD_IMPORT_MIGRATION.sql"\n');

    console.log('✅ Migration script has been prepared at: APPLY_LEAD_IMPORT_MIGRATION.sql');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
