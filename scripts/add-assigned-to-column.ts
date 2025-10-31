import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumn() {
  console.log('🔧 Adding assigned_to column to lead_imports table...\n');

  // Since we can't run raw SQL through the REST API, we need to provide instructions
  console.log('⚠️ IMPORTANT: This column needs to be added via the Supabase SQL Editor\n');

  console.log('📋 STEPS TO FIX:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new\n');
  console.log('2. Copy and paste this SQL:\n');
  console.log('   -- Add assigned_to column');
  console.log('   ALTER TABLE lead_imports');
  console.log('   ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;\n');
  console.log('   -- Create index');
  console.log('   CREATE INDEX IF NOT EXISTS idx_lead_imports_assigned_to ON lead_imports(assigned_to);\n');
  console.log('   -- Add comment');
  console.log('   COMMENT ON COLUMN lead_imports.assigned_to IS \'Which SDR these leads were assigned to\';\n');
  console.log('3. Click "Run"\n');

  console.log('Or use the pre-made SQL file:');
  console.log('   File: FIX_LEAD_IMPORTS_ADD_ASSIGNED_TO.sql\n');

  // Check current state
  console.log('🔍 Current lead_imports columns:');
  const { data, error } = await supabase
    .from('lead_imports')
    .select('*')
    .limit(1);

  if (data && data[0]) {
    const columns = Object.keys(data[0]);
    columns.forEach(col => {
      if (col === 'assigned_to') {
        console.log('   ✅', col);
      } else {
        console.log('   •', col);
      }
    });

    if (!columns.includes('assigned_to')) {
      console.log('\n❌ assigned_to column is MISSING');
      console.log('   Please run the SQL above to add it.');
    } else {
      console.log('\n✅ assigned_to column exists!');
    }
  }
}

addColumn();
