import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function mapColumns() {
  console.log('🔍 Mapping API expectations vs actual database columns\n');

  // Get actual columns
  const { data, error } = await supabase
    .from('lead_imports')
    .select('*')
    .limit(1);

  if (error || !data || data.length === 0) {
    console.log('❌ Error fetching table structure');
    return;
  }

  const actualColumns = Object.keys(data[0]);

  // API expectations from route.ts
  const apiExpectations = {
    'imported_by': 'Who created this import',
    'assigned_to': 'Which SDR to assign leads to',
    'import_type': 'Type: csv, manual, api',
    'total_rows': 'Number of leads in import',
    'status': 'Import status',
    'settings': 'Import configuration JSON',
  };

  console.log('📊 ACTUAL DATABASE COLUMNS:');
  console.log('─'.repeat(50));
  actualColumns.forEach(col => console.log(`  • ${col}`));

  console.log('\n📋 API EXPECTATIONS vs REALITY:');
  console.log('─'.repeat(50));

  Object.entries(apiExpectations).forEach(([apiCol, description]) => {
    const exists = actualColumns.includes(apiCol);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${apiCol.padEnd(20)} - ${description}`);

    if (!exists) {
      // Try to find similar column
      const similar = actualColumns.find(col =>
        col.toLowerCase().includes(apiCol.split('_')[0]) ||
        apiCol.toLowerCase().includes(col.split('_')[0])
      );
      if (similar) {
        console.log(`   💡 Similar column found: ${similar}`);
      }
    }
  });

  console.log('\n🔧 REQUIRED CHANGES:\n');

  // Check each expected column
  const changes = [];

  if (!actualColumns.includes('assigned_to')) {
    changes.push('❌ MISSING: assigned_to - Add with ALTER TABLE');
  }

  if (!actualColumns.includes('import_type') && actualColumns.includes('import_source')) {
    changes.push('⚠️  MISMATCH: API uses "import_type" but DB has "import_source"');
    changes.push('   Fix: Change API code to use "import_source"');
  }

  if (!actualColumns.includes('settings') && actualColumns.includes('duplicate_handling')) {
    changes.push('⚠️  MISMATCH: API uses "settings" (JSONB) but DB has "duplicate_handling"');
    changes.push('   Fix: Either add "settings" column OR change API to use existing columns');
  }

  if (changes.length === 0) {
    console.log('✅ All columns match!');
  } else {
    changes.forEach(change => console.log(change));
  }
}

mapColumns();
