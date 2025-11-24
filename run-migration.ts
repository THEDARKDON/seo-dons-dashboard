/**
 * Script to run database migration
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration: add_html_url_to_proposals.sql');

    const sqlPath = path.join(__dirname, 'add_html_url_to_proposals.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runMigration();
