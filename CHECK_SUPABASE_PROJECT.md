# 🔍 CHECK SUPABASE PROJECT STATUS

Since env vars are fine and unchanged since October, the issue is likely:

## 🎯 Most Likely Causes Now:

### 1. ⭐⭐⭐ Supabase RLS Policies Changed (60% chance)
**What happened:** Row Level Security policies were modified or deleted

**Check:**
1. Go to: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/auth/policies
2. Look for policies on `users` table
3. Check if there's a policy allowing SELECT by clerk_id

**If no policy exists or policy was deleted** → This is your problem!

**Quick test:**
Run in Supabase SQL Editor:
```sql
-- Should return users
SELECT clerk_id, email FROM users LIMIT 5;

-- If empty or error → RLS is blocking
```

---

### 2. ⭐⭐ Supabase Project Auto-Paused (20% chance)
**What happened:** Free tier projects pause after inactivity

**Check:**
1. Go to: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw
2. Look for a yellow banner saying "Project paused"
3. Check project status indicator (top right)

**If paused:**
- Click "Restore project"
- Wait 2-3 minutes
- Test again

---

### 3. ⭐⭐ Clerk Session Cookie Domain Issue (15% chance)
**What happened:** Clerk changed session cookie settings or domain verification

**Check:**
1. Go to: https://dashboard.clerk.com/apps/your-app/instances/production/domains
2. Verify your production domain is listed
3. Check if domain verification expired

**Browser test:**
1. Open your app in browser
2. Open DevTools (F12) → Application → Cookies
3. Look for `__clerk_db_jwt` cookie
4. Check if it exists and has your domain

**If cookie is missing or wrong domain** → Session not being set!

---

### 4. ⭐ Database Connection Limit Hit (3% chance)
**What happened:** Too many connections to database

**Check:**
1. Go to: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/reports/database
2. Look at "Connection pooling" graph
3. Check if hitting limit

**If at limit:**
- Restart Supabase pooler
- Or upgrade plan

---

### 5. ⭐ Supabase API Down/Degraded (2% chance)
**What happened:** Supabase service issue

**Check:**
https://status.supabase.com/

---

## 🔧 IMMEDIATE DIAGNOSTIC STEPS

### Step 1: Test Supabase Connection
Run in Supabase SQL Editor:
```sql
-- This should work
SELECT NOW() as current_time;

-- This tests users table access
SELECT COUNT(*) FROM users;

-- This tests if you can find a specific clerk_id
SELECT * FROM users WHERE clerk_id LIKE 'user_%' LIMIT 1;
```

**Results:**
- ✅ All work → Supabase is fine, issue is in app
- ❌ COUNT returns 0 → RLS is blocking
- ❌ Error → Connection or table issue

---

### Step 2: Check Recent Supabase Activity
1. Go to: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/logs/postgres-logs
2. Look for errors in last 24 hours
3. Filter by "error" or "failed"

**Look for:**
- RLS policy violations
- Connection errors
- Permission denied errors

---

### Step 3: Test Auth Flow Manually
Create test API route: `app/api/debug-auth/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Step 1: Check Clerk auth
    const { userId } = await auth();
    console.log('Clerk userId:', userId);

    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated with Clerk',
        step: 'clerk_auth'
      });
    }

    // Step 2: Check Supabase connection
    const supabase = await createClient();
    const { data: testQuery, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    console.log('Supabase test query:', testQuery, testError);

    if (testError) {
      return NextResponse.json({
        error: 'Supabase connection failed',
        details: testError.message,
        step: 'supabase_connection'
      });
    }

    // Step 3: Try to find user by clerk_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email, role')
      .eq('clerk_id', userId)
      .single();

    console.log('User lookup result:', user, userError);

    if (userError) {
      return NextResponse.json({
        error: 'User lookup failed',
        clerkUserId: userId,
        details: userError.message,
        code: userError.code,
        hint: userError.hint,
        step: 'user_lookup'
      });
    }

    if (!user) {
      // Check if user exists with different clerk_id
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('clerk_id, email')
        .limit(5);

      return NextResponse.json({
        error: 'User not found',
        clerkUserId: userId,
        clerkUserIdLength: userId.length,
        sampleUsersInDb: allUsers?.map(u => ({
          clerk_id: u.clerk_id,
          clerk_id_length: u.clerk_id?.length,
          email: u.email
        })),
        step: 'user_not_found'
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerk_id: user.clerk_id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      step: 'uncaught_error'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
```

**Deploy and visit:** `https://your-domain.vercel.app/api/debug-auth`

**This will tell you EXACTLY where it's failing!**

---

## 📊 What to Check in Supabase Dashboard RIGHT NOW

### 1. Project Status
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw
- ✅ Green status indicator?
- ⚠️ Any warnings/alerts?

### 2. RLS Policies
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/auth/policies
- Check `users` table
- Should have policies for SELECT

### 3. Database Health
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/reports/database
- Check active connections
- Check if database is responding

### 4. Recent Logs
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/logs/postgres-logs
- Last 24 hours
- Filter: "error"

---

## 🚨 QUICK FIXES

### Fix 1: Temporarily Disable RLS (TESTING ONLY!)
```sql
-- In Supabase SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test your app
-- If it works → RLS was blocking

-- Re-enable after testing!
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Fix 2: Add Missing RLS Policy
```sql
-- Allow anon role to read users
CREATE POLICY "Allow authenticated user lookup"
ON users
FOR SELECT
TO anon, authenticated
USING (true);
```

### Fix 3: Restore Paused Project
If project shows as paused:
1. Click "Restore" button
2. Wait 2-3 minutes
3. Test again

---

## 📝 What to Send Me

If still broken, tell me:

1. **Result from this SQL in Supabase:**
   ```sql
   SELECT clerk_id, email FROM users LIMIT 3;
   ```

2. **RLS status:**
   ```sql
   SELECT rowsecurity FROM pg_tables WHERE tablename = 'users';
   ```

3. **Output from:** `/api/debug-auth` route

4. **Any yellow/red alerts** in Supabase dashboard

This will pinpoint the EXACT issue!
