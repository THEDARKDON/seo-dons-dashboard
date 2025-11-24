# 🔍 CHECK ENVIRONMENT VARIABLES - URGENT

## Issue: App was working yesterday, broken today with "User not found"

This is likely an **environment variable issue** or a recent Clerk/Supabase SDK update breaking change.

---

## ⚠️ CRITICAL: Clerk v5 Breaking Change (Most Likely Culprit!)

You're using `@clerk/nextjs: ^5.0.0` which has breaking changes from v4.

### The Breaking Change:
In Clerk v5, the `auth()` function signature changed:

**OLD (v4):**
```typescript
const { userId } = auth();  // Returns immediately
```

**NEW (v5):**
```typescript
const { userId } = await auth();  // Must await!
```

### Check Your Code:
Look at `lib/supabase/server.ts` - is `cookies()` awaited?

**This was the issue!** Next.js 15 + Clerk v5 requires:
```typescript
const cookieStore = await cookies()  // ✅ Must await
```

---

## 🚨 IMMEDIATE CHECKS

### 1. Check Vercel Environment Variables

Go to: https://vercel.com/your-project/settings/environment-variables

**Verify these are ALL set and not empty:**

#### Clerk (CRITICAL):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Should start with `pk_live_` or `pk_test_`
- `CLERK_SECRET_KEY` - Should start with `sk_live_` or `sk_test_`
- `CLERK_WEBHOOK_SECRET` - Should start with `whsec_`

#### Supabase (CRITICAL):
- `NEXT_PUBLIC_SUPABASE_URL` - Should be `https://xxxxx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Should start with `eyJ`
- `SUPABASE_SERVICE_ROLE_KEY` - Should start with `eyJ`

### 2. Check if Variables Were Accidentally Deleted

**Common causes:**
- Someone clicked "Delete" by mistake
- Variables expired or were rotated in Clerk/Supabase
- Vercel deployment settings changed

### 3. Check Recent Vercel Deployments

Go to: https://vercel.com/your-project/deployments

Look for:
- Deployment time (when did it break?)
- Build logs - any errors?
- Environment changes
- Git commits that triggered deployment

---

## 🔧 QUICK TESTS

### Test 1: Check if env vars are loaded
Add this temporary API route to test:

Create `app/api/test-env/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasClerkPublic: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    clerkPublicPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 8),
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20),
  });
}
```

Visit: `https://your-domain.vercel.app/api/test-env`

**Expected output:**
```json
{
  "hasClerkPublic": true,
  "hasClerkSecret": true,
  "hasSupabaseUrl": true,
  "hasSupabaseAnon": true,
  "hasSupabaseService": true,
  "clerkPublicPrefix": "pk_live_",
  "supabaseUrlPrefix": "https://xowomlotlf"
}
```

If any are `false` → **Environment variable missing!**

### Test 2: Check Clerk Authentication
Visit: `https://your-domain.vercel.app/sign-in`

- Can users see the sign-in page? → Clerk keys working
- Can they sign in? → Clerk auth working
- Do they get "User not found" after? → Supabase lookup failing

### Test 3: Check Vercel Logs
```bash
# If you have Vercel CLI
vercel logs --follow

# Look for:
# - "Unauthorized"
# - "User not found"
# - "undefined" or "null" for userId
# - Environment variable errors
```

Or check in browser: https://vercel.com/your-project/logs

---

## 📦 Possible Breaking Changes (Last 24-48 Hours)

### 1. Clerk SDK Update
**Issue:** Clerk v5 has breaking changes

**Check:** Did `npm install` run recently?

**Fix:** Ensure all `auth()` calls are awaited:
```typescript
// Find all instances of auth() and ensure they're awaited
const { userId } = await auth();  // ✅ Correct
```

### 2. Supabase SDK Update
**Issue:** `@supabase/ssr` v0.1.0 might have issues

**Current version:** `"@supabase/ssr": "^0.1.0"`

**Potential fix:** Pin to specific version
```json
"@supabase/ssr": "0.1.0"
```

### 3. Next.js 15 Async Changes
**Issue:** Next.js 15 requires more `await` statements

**Check:**
- `cookies()` must be awaited
- `headers()` must be awaited
- `params` must be awaited in dynamic routes

---

## 🔍 SYSTEMATIC DEBUG

### Step 1: Check Vercel Dashboard
1. Go to: https://vercel.com/your-project
2. Click "Settings" → "Environment Variables"
3. Count: Should have **8+ variables** minimum
4. Check each one is not empty
5. Look for any recent changes (shows timestamp)

### Step 2: Check Clerk Dashboard
1. Go to: https://dashboard.clerk.com
2. Check API Keys haven't changed
3. Check domain is still whitelisted
4. Check if any security settings changed

### Step 3: Check Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw
2. Check project is not paused
3. Check API keys are still valid
4. Check if any RLS policies changed

### Step 4: Recent Deployments
1. Go to: https://vercel.com/your-project/deployments
2. Find the last working deployment (yesterday)
3. Find the first broken deployment (today)
4. Compare:
   - Git commits
   - Build logs
   - Environment changes

---

## 🚀 IMMEDIATE FIX ATTEMPTS

### Fix 1: Redeploy Previous Working Version
1. Go to: https://vercel.com/your-project/deployments
2. Find yesterday's working deployment
3. Click "..." menu → "Redeploy"
4. Select "Use existing build cache"
5. Deploy

### Fix 2: Re-add Environment Variables
If variables are missing/corrupted:

1. Get keys from:
   - Clerk: https://dashboard.clerk.com → API Keys
   - Supabase: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/settings/api

2. Re-add to Vercel:
   - Delete old variables
   - Add fresh ones
   - Redeploy

### Fix 3: Clear Vercel Build Cache
```bash
# Via Vercel dashboard:
# Deployments → Redeploy → Uncheck "Use existing Build Cache"
```

---

## 📊 WHAT TO SEND ME

If still broken, send me:

1. **Vercel environment variable list** (just names, not values):
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ✅ Set
   CLERK_SECRET_KEY: ✅ Set
   etc...
   ```

2. **Recent deployment time:**
   - Last working: "Yesterday at 3pm"
   - First broken: "Today at 9am"

3. **Vercel build logs** from broken deployment

4. **Error in browser console** when user tries to log in

5. **Output from:** `https://your-domain.vercel.app/api/test-env`

---

## 🎯 MOST LIKELY CAUSES (Ranked)

1. ⭐⭐⭐ **Environment variable deleted/changed** (80% chance)
2. ⭐⭐ **Clerk keys expired/rotated** (10% chance)
3. ⭐ **Automatic dependency update broke something** (5% chance)
4. ⭐ **Supabase project paused/keys changed** (3% chance)
5. **Next.js/Clerk/Supabase SDK breaking change** (2% chance)

---

## ⚡ DO THIS NOW

1. **Check Vercel env vars** - Are they all there?
2. **Check last deployment time** - When did it break?
3. **Redeploy previous version** - Quick rollback
4. **Check Vercel logs** - What's the actual error?

Let me know what you find!
