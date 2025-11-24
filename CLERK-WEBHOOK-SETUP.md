# Clerk Webhook Setup Guide

## What This Does
Automatically syncs new users from Clerk to your Supabase database when they sign up.

## Current Status
❌ **Not Set Up Yet** - Users must be manually created in Supabase database
✅ **Webhook Code Ready** - Located at `/api/webhook/clerk`

## Setup Instructions

### Step 1: Add Webhook Secret to Environment Variables

1. Open your `.env.local` file
2. Add this line:
```env
CLERK_WEBHOOK_SECRET=your_signing_secret_here
```

### Step 2: Configure Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Click **Webhooks** in the left sidebar
4. Click **+ Add Endpoint**

5. **Enter Endpoint URL:**
   - **For Local Development:** `https://your-ngrok-url.ngrok.io/api/webhook/clerk`
   - **For Production (Netlify):** `https://your-domain.netlify.app/api/webhook/clerk`

6. **Subscribe to Events:**
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`

7. Click **Create**

8. **Copy the Signing Secret:**
   - After creating, click on your webhook
   - Copy the **Signing Secret** (starts with `whsec_...`)
   - Paste it into `.env.local` as `CLERK_WEBHOOK_SECRET`

### Step 3: Test the Webhook

#### Option A: Test with ngrok (Local Development)

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start your dev server:
```bash
npm run dev
```

3. In a new terminal, start ngrok:
```bash
ngrok http 3000
```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Update your Clerk webhook endpoint URL with the ngrok URL

6. Create a test user in Clerk:
   - Go to Clerk Dashboard > Users
   - Click **+ Create User**
   - Fill in details and create

7. Check your terminal logs - you should see:
```
✅ User synced to Supabase: { id: '...', clerk_id: '...', email: '...' }
```

8. Verify in Supabase:
   - Go to Supabase Dashboard > Table Editor > users
   - You should see the new user

#### Option B: Test in Production (Netlify)

1. Deploy to Netlify
2. Update webhook URL to your Netlify domain
3. Create a test user and verify

### Step 4: Update Environment Variables

**Local (.env.local):**
```env
CLERK_WEBHOOK_SECRET=whsec_...
```

**Netlify (Production):**
1. Go to Netlify Dashboard
2. Site Settings > Environment Variables
3. Add `CLERK_WEBHOOK_SECRET` with your signing secret

## What Happens When a User Signs Up

1. User signs up via Clerk (e.g., on `/sign-up` page)
2. Clerk creates the user account
3. Clerk sends webhook to your `/api/webhook/clerk` endpoint
4. Your webhook creates a user record in Supabase `users` table with:
   - `clerk_id`: Clerk user ID
   - `email`: User's email
   - `first_name`: User's first name
   - `last_name`: User's last name
   - `avatar_url`: Profile image URL
   - `role`: 'bdr' (default)
   - `active`: true

5. User can now create deals, log calls, etc.

## Troubleshooting

### Webhook Not Firing

**Check 1: Verify webhook is enabled in Clerk**
- Clerk Dashboard > Webhooks > Your endpoint should be "Active"

**Check 2: Check webhook logs in Clerk**
- Clerk Dashboard > Webhooks > Click your endpoint
- View "Recent Attempts" to see if webhooks are being sent

**Check 3: Verify signing secret**
- Make sure `CLERK_WEBHOOK_SECRET` in `.env.local` matches the one in Clerk
- Restart your dev server after updating `.env.local`

### User Not Created in Supabase

**Check 1: View server logs**
```bash
# Look for errors in your terminal where npm run dev is running
```

**Check 2: Verify Supabase credentials**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- This key bypasses RLS for webhook operations

**Check 3: Check Supabase table structure**
- Verify `users` table exists
- Verify columns match: clerk_id, email, first_name, last_name, avatar_url, role, active

### Error: "Webhook secret not configured"

Add to `.env.local`:
```env
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

### Error: "Invalid signature"

- Signing secret doesn't match
- Copy the correct secret from Clerk Dashboard > Webhooks > Your endpoint
- Update `.env.local`
- Restart dev server

## Alternative: Manual User Creation

If you don't want to set up webhooks, you can manually create users in Supabase after they sign up in Clerk:

```sql
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES ('user_xxxxx', 'email@example.com', 'John', 'Doe', 'bdr');
```

Get the `clerk_id` from Clerk Dashboard > Users > Click user > Copy "User ID"

## Files Modified

- ✅ `app/api/webhook/clerk/route.ts` - Webhook handler
- ✅ `package.json` - Added `svix` dependency for webhook verification
- ✅ `.env.local` - Need to add `CLERK_WEBHOOK_SECRET`
