# Run Migration 039 - Add Secondary Phone to Leads

The phone_secondary column needs to be added to your production database to allow leads to have multiple phone numbers.

## Option 1: Via Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL and run it:

```sql
-- Add secondary phone field to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS phone_secondary TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_phone_secondary ON leads(phone_secondary);

-- Add comment
COMMENT ON COLUMN leads.phone_secondary IS 'Secondary/alternate phone number for the lead';
```

5. Click **Run** (or press Ctrl/Cmd + Enter)

## Option 2: Via Supabase CLI

If you have Supabase CLI installed locally:

```bash
# Make sure you're linked to your production project
npx supabase db push
```

## Verify the Migration

After running the migration, verify it worked:

```sql
-- Check if the column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'phone_secondary';
```

You should see:
- column_name: phone_secondary
- data_type: text

## After Running Migration

Once the migration is complete:
1. The phone_secondary column will exist in your production database
2. You can import leads with secondary phone numbers
3. Lead details will show both phone numbers
4. Click-to-call will have a dropdown to select which number to call
