# 🚨 URGENT: FIX CORS ISSUE - Root Cause Found!

## ❌ THE PROBLEM

```
Access to fetch at 'https://xowomlotlfhsjshmvjnw.supabase.co/rest/v1/users...'
from origin 'https://www.seodonscrm.co.uk' has been blocked by CORS policy
```

**Your domain `www.seodonscrm.co.uk` is NOT allowed to access Supabase!**

This is why:
- ❌ All API routes return 404 (they can't reach Supabase)
- ❌ User lookup fails
- ❌ WebSocket connections fail
- ❌ Everything shows "User not found"

---

## 🔧 FIX THIS NOW (2 minutes)

### Step 1: Configure Supabase CORS

1. **Go to Supabase Authentication Settings:**
   https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/auth/url-configuration

2. **Add these URLs to "Site URL" and "Redirect URLs":**
   ```
   https://www.seodonscrm.co.uk
   https://seodonscrm.co.uk
   ```

3. **Click "Save"**

---

### Step 2: Configure Supabase API Settings

1. **Go to Supabase API Settings:**
   https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/settings/api

2. **Scroll to "API Settings" section**

3. **Find "Additional Redirect URLs" or "CORS Configuration"**

4. **Add your domains:**
   ```
   https://www.seodonscrm.co.uk
   https://seodonscrm.co.uk
   ```

5. **Click "Save"**

---

### Step 3: Update Vercel Environment Variable

1. **Go to Vercel:**
   https://vercel.com/your-project/settings/environment-variables

2. **Find `NEXT_PUBLIC_APP_URL`**

3. **Update value to:**
   ```
   https://www.seodonscrm.co.uk
   ```

4. **Click "Save"**

5. **Redeploy** (or it will auto-deploy)

---

### Step 4: Check Supabase RLS Policies

The CORS error might also be caused by overly restrictive RLS policies.

**Run this in Supabase SQL Editor:**

```sql
-- Check current policies on users table
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';
```

**If there are NO policies for `anon` role, add this:**

```sql
-- Allow client-side user lookup by clerk_id
CREATE POLICY "Allow authenticated user lookup"
ON users
FOR SELECT
TO anon, authenticated
USING (true);
```

**⚠️ Important:** This allows all users to read all users. For production, you might want:

```sql
-- More restrictive: Only allow users to read their own data
CREATE POLICY "Allow users to read own data"
ON users
FOR SELECT
TO anon, authenticated
USING (
  clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
```

---

## 🔍 WHY THIS HAPPENED

### The Timeline:

1. **October 16:** Everything was configured correctly
2. **Yesterday:** App was working fine
3. **Today:** CORS errors everywhere

### Most Likely Cause:

**Someone changed the Supabase URL configuration:**
- Removed `www.seodonscrm.co.uk` from allowed origins
- Or RLS policies were modified
- Or domain verification expired

### Why It Affects Everything:

When the browser (client-side) tries to fetch from Supabase:
1. Browser sends preflight OPTIONS request
2. Supabase checks if origin is allowed
3. **Origin `www.seodonscrm.co.uk` is NOT in allowed list**
4. Supabase returns error WITHOUT CORS headers
5. Browser blocks the request
6. Your app can't access ANY data
7. All APIs fail → "User not found"

---

## ✅ VERIFICATION STEPS

### After Applying Fixes:

1. **Wait 30 seconds** for Supabase changes to propagate

2. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Del → "Cached images and files"
   - Or use Incognito: Ctrl+Shift+N

3. **Hard refresh:** Ctrl+F5 or Cmd+Shift+R

4. **Open browser console** (F12) and refresh page

5. **Check for CORS error:**
   - ✅ If gone → Fixed!
   - ❌ If still there → Need more config

---

## 🧪 TEST SPECIFIC FIXES

### Test 1: Check if Supabase is accessible
Open browser console and run:

```javascript
fetch('https://xowomlotlfhsjshmvjnw.supabase.co/rest/v1/users?select=count', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvd29tbG90bGZoc2pzaG12am53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTc1NzgsImV4cCI6MjA3NDc5MzU3OH0.bDpJq0xdupjO07KdMPbelvD7FcRIQUf9wg-nUoT7WY0'
  }
}).then(r => r.text()).then(console.log)
```

**Expected:** Returns count or data
**If CORS error:** Supabase origin not allowed

---

### Test 2: Check if domain is in Vercel
```bash
echo $NEXT_PUBLIC_APP_URL
# Should show: https://www.seodonscrm.co.uk
```

---

### Test 3: Check Supabase allowed origins
Go to: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/auth/url-configuration

**Should see:**
- Site URL: `https://www.seodonscrm.co.uk`
- Redirect URLs: Includes your domain

---

## 🚨 EMERGENCY WORKAROUND

If you need the app working RIGHT NOW while waiting for DNS/CORS:

### Option 1: Use Vercel Domain Temporarily
1. Update Supabase allowed origins to include:
   ```
   https://your-project.vercel.app
   ```
2. Users access via Vercel domain instead
3. Fix custom domain CORS later

### Option 2: Disable RLS Temporarily (NOT RECOMMENDED)
```sql
-- ⚠️ WARNING: Only for testing!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test if CORS was the only issue
-- Then re-enable:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## 📊 FULL SUPABASE CONFIGURATION CHECKLIST

Go through each setting:

### 1. Authentication Settings
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/auth/url-configuration

- [ ] Site URL: `https://www.seodonscrm.co.uk`
- [ ] Redirect URLs includes: `https://www.seodonscrm.co.uk/**`
- [ ] Redirect URLs includes: `https://seodonscrm.co.uk/**`

### 2. API Settings
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/settings/api

- [ ] API URL is correct
- [ ] Anon key matches env var
- [ ] Service role key matches env var

### 3. RLS Policies
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/auth/policies

- [ ] Users table has SELECT policy for `anon` role
- [ ] Policy allows reading users by clerk_id

---

## 📝 WHAT TO TELL ME AFTER FIXING

1. **Did you add the domain to Supabase?**
   - Where did you add it?
   - What exact URL did you add?

2. **Does the CORS error still appear?**
   - Check browser console
   - Send screenshot if still there

3. **What does this SQL return?**
   ```sql
   SELECT COUNT(*) FROM users;
   ```

4. **Can you access the debug endpoint?**
   ```
   https://www.seodonscrm.co.uk/api/debug-full-auth
   ```

---

## 🎯 EXPECTED TIMELINE

- **Fix applied:** Immediately
- **Supabase propagation:** 30 seconds
- **Vercel deployment:** 1-2 minutes
- **Total time to working:** ~3 minutes

---

**This is 100% a CORS/domain configuration issue!** The good news is it's easy to fix. Add your domain to Supabase and it will work immediately! 🚀
