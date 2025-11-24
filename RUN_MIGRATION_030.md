# ⚠️ URGENT: Run Migration 030

Your deployment is failing because **Migration 030 hasn't been run yet**.

## Quick Fix (Choose One Method):

### Method 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/030_fix_activity_sync_and_customer_creation.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Wait for "Success" message

### Method 2: Supabase CLI

```bash
# If you have Supabase CLI installed
cd "d:\LeaderBoard and Audit Site"
supabase db push
```

### Method 3: Direct PostgreSQL

```bash
# If you have psql installed
psql "your-database-connection-string" -f supabase/migrations/030_fix_activity_sync_and_customer_creation.sql
```

## What This Migration Does:

✅ **Creates notifications table** (fixes "table not found" error)
✅ **Fixes lead activities sync** (fixes check constraint violation)
✅ **Adds auto-customer creation from deals**
✅ **Sets up notification triggers** (SMS replies, missed calls, new leads)

## After Running:

1. **Verify it worked:**
   ```sql
   -- In Supabase SQL Editor
   SELECT COUNT(*) FROM notifications;
   -- Should return 0 (empty table, which is expected)
   ```

2. **Refresh your app:**
   - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Notification bell should appear
   - No more "table not found" errors

## Troubleshooting:

**If migration fails:**
- Check if tables already exist (notifications, etc.)
- You may need to skip duplicate table creation errors
- The triggers will be recreated (safe to run multiple times)

**Still getting errors?**
- Check browser console for exact error message
- Verify database connection in .env.local
- Make sure Supabase project is active (not paused)

## Expected Results:

After migration runs successfully:
- ✅ Notification bell appears in header
- ✅ No console errors about "notifications table"
- ✅ Calls to leads create activity records
- ✅ SMS/Email badges show in sidebar
- ✅ Auto-send messages work after calls

---

**Need Help?**
Check the error logs in:
1. Browser console (F12)
2. Supabase Dashboard → Logs
3. Vercel Dashboard → Runtime Logs
