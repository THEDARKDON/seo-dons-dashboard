# Run Migration 038 - Add Lead Categories

The category column needs to be added to your production database.

## Option 1: Via Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL and run it:

```sql
-- Add category field to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);

-- Add comment
COMMENT ON COLUMN leads.category IS 'Manual lead categorization: cold, warm, hot, instantly_opened, etc.';
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
WHERE table_name = 'leads' AND column_name = 'category';
```

You should see:
- column_name: category
- data_type: text

## After Running Migration

Once the migration is complete:
1. The category column will exist in your production database
2. You can import leads with categories
3. Categories will be saved and displayed properly
4. Duplicate leads will have their categories updated during import
