# 🚨 URGENT FIX: User Not Found Error

## Problem
Users can log in via Clerk but get "User not found" error when accessing the dashboard.

## Root Cause
**Clerk User IDs in Supabase don't match the actual Clerk User IDs.**

When the app checks:
```typescript
// This lookup fails because clerk_id doesn't match
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_id', userId)  // ← This doesn't match
  .single();
```

## Immediate Fix (5 minutes)

### Step 1: Get Clerk User IDs
1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to your app
3. Click "Users" in sidebar
4. For EACH user having login issues:
   - Click on the user
   - Copy their **User ID** (looks like: `user_2xxxxxxxxxxxxxxxxxxxxx`)
   - Note their email address

### Step 2: Update Supabase
1. Go to Supabase: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/editor
2. Click "SQL Editor"
3. For each user, run this query:

```sql
-- Replace with actual values
UPDATE users
SET clerk_id = 'user_2xxxxxxxxxxxxxxxxxxxxx'  -- From Clerk Dashboard
WHERE email = 'their@email.com';
```

### Step 3: Verify the Fix
```sql
-- Check that clerk_id is updated
SELECT clerk_id, email, first_name, last_name, role
FROM users
WHERE email = 'their@email.com';
```

### Step 4: Test
Have the user:
1. Log out completely (clear browser cache if needed)
2. Log back in
3. They should now see the dashboard ✅

---

## Quick Batch Fix (if multiple users affected)

### Option A: Run diagnostic first
```sql
-- See all users and their current clerk_ids
SELECT
  id,
  clerk_id,
  email,
  first_name,
  last_name,
  role
FROM users
ORDER BY email;
```

### Option B: Update multiple users at once
```sql
-- Update user 1
UPDATE users SET clerk_id = 'user_2xxxxxxxxxxxxx1' WHERE email = 'user1@example.com';

-- Update user 2
UPDATE users SET clerk_id = 'user_2xxxxxxxxxxxxx2' WHERE email = 'user2@example.com';

-- Update user 3
UPDATE users SET clerk_id = 'user_2xxxxxxxxxxxxx3' WHERE email = 'user3@example.com';

-- Verify all updates
SELECT clerk_id, email, first_name, last_name
FROM users
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');
```

---

## Why This Happened

One of these scenarios likely occurred:

1. **Manual user creation**: Users were manually added to Supabase without proper Clerk IDs
2. **Webhook not configured**: Clerk webhook wasn't set up, so users weren't auto-synced
3. **Clerk ID changed**: User accounts were recreated in Clerk with new IDs
4. **Database migration**: Old clerk_ids weren't migrated properly

---

## Permanent Fix: Configure Clerk Webhook

To prevent this in the future:

### 1. Create/Verify Webhook Endpoint
Your app already has the webhook handler at:
```
https://your-domain.vercel.app/api/webhook/clerk
```

### 2. Configure in Clerk
1. Go to: https://dashboard.clerk.com/apps/your-app/webhooks
2. Click "Add Endpoint"
3. Enter webhook URL: `https://your-domain.vercel.app/api/webhook/clerk`
4. Subscribe to events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Click "Create"
6. Copy the **Signing Secret** (looks like: `whsec_xxxxxxxxxxxxxxxxxxxxx`)

### 3. Add Secret to Vercel
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add new variable:
   - **Name**: `CLERK_WEBHOOK_SECRET`
   - **Value**: `whsec_xxxxxxxxxxxxxxxxxxxxx` (from step 2)
   - **Environment**: All (Production, Preview, Development)
3. Click "Save"
4. Redeploy your app

### 4. Test the Webhook
1. Create a test user in Clerk
2. Check Vercel logs for webhook activity:
   ```
   🔔 Clerk webhook endpoint hit
   📥 Clerk Webhook Received: user.created
   ✅ User created successfully
   ```
3. Check Supabase - new user should appear automatically

---

## Verification Checklist

After applying the fix:

- [ ] All existing users have valid clerk_ids
- [ ] Users can log in without "User not found" error
- [ ] Dashboard loads correctly for all users
- [ ] Clerk webhook is configured and working
- [ ] CLERK_WEBHOOK_SECRET is set in Vercel
- [ ] Test new user signup works automatically

---

## Debug Commands

### Check user in Supabase:
```sql
SELECT * FROM users WHERE email = 'problematic@email.com';
```

### Check Clerk User ID format:
Valid: `user_2xxxxxxxxxxxxxxxxxxxxx` (starts with `user_` and is ~27 characters)
Invalid: `123`, `null`, empty string, or short IDs

### View recent logins in Vercel logs:
```bash
vercel logs --follow
# Look for errors related to "User not found"
```

---

## Still Having Issues?

### Check these:

1. **Clerk keys are correct**
   - Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Vercel
   - Verify `CLERK_SECRET_KEY` in Vercel
   - Make sure you're using PRODUCTION keys, not test keys

2. **Supabase connection**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` in Vercel
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
   - Verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel

3. **User permissions**
   - Check Supabase RLS policies allow user lookups
   - Verify users table has correct structure

4. **Cache issues**
   - Clear browser cache
   - Try incognito/private window
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## Need Help?

1. Run `DIAGNOSE_USER_NOT_FOUND.sql` in Supabase SQL Editor
2. Check Vercel deployment logs
3. Check Clerk event logs: https://dashboard.clerk.com/apps/your-app/logs
4. Verify environment variables in Vercel are all set

---

**This should fix the issue immediately!** 🎉

The key is matching the Clerk User IDs from Clerk Dashboard to the `clerk_id` column in your Supabase `users` table.
