/**
 * Add html_url column to proposals table
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addHtmlUrlColumn() {
  try {
    console.log('Adding html_url column to proposals table...');

    // Using raw SQL query through the REST API
    const { data, error } = await supabase
      .from('proposals')
      .select('html_url')
      .limit(1);

    if (error && error.message.includes('column "html_url" does not exist')) {
      console.log('Column does not exist, but we cannot add it via the client.');
      console.log('Please run this SQL manually in Supabase SQL Editor:');
      console.log('\nALTER TABLE proposals ADD COLUMN IF NOT EXISTS html_url TEXT;');
      console.log('COMMENT ON COLUMN proposals.html_url IS \'URL to the HTML version of the proposal for web viewing\';');
      process.exit(0);
    } else if (error) {
      console.error('Error checking column:', error);
      process.exit(1);
    } else {
      console.log('✓ html_url column already exists!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addHtmlUrlColumn();
