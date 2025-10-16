# Webhook Debugging Guide

## Current Setup
- **Webhook URL:** https://seodonscrm.co.uk/api/webhook/clerk
- **Should be:** https://www.seodonscrm.co.uk/api/webhook/clerk (with www)
- **Signing Secret:** whsec_mLO0nmdS+VJewlYN+4FcW5QwIntGcxRX

## Issue
The webhook is redirecting, which breaks signature verification.

## Fix Steps

### 1. Update Clerk Webhook URL
Go to Clerk Dashboard → Webhooks → Edit endpoint
Change URL to: **https://www.seodonscrm.co.uk/api/webhook/clerk**
(Include the www)

### 2. Verify Environment Variable in Vercel
1. Go to Vercel Dashboard → seodonscrm → Settings → Environment Variables
2. Check if `CLERK_WEBHOOK_SECRET` exists
3. Value should be: `whsec_mLO0nmdS+VJewlYN+4FcW5QwIntGcxRX`
4. Make sure it's enabled for "Production" environment
5. Redeploy after adding

### 3. Check Webhook Logs in Vercel
1. Go to Vercel Dashboard → seodonscrm → Logs
2. Filter by: `/api/webhook/clerk`
3. Look for these messages:
   - ✅ "📥 Clerk Webhook Received: user.created"
   - ✅ "✅ User created successfully"
   - ❌ "Webhook secret not configured"
   - ❌ "Invalid signature"

### 4. Test Webhook from Clerk Dashboard
1. Go to Clerk → Webhooks → Your endpoint
2. Click "Testing" tab
3. Send a test `user.created` event
4. Check the response and logs

### 5. Check Supabase for User
After creating "Don SDR" (user_34AGg4jwcrXhzUhhtI3BKPkzfU3):

```sql
SELECT * FROM users WHERE clerk_id = 'user_34AGg4jwcrXhzUhhtI3BKPkzfU3';
```

If NOT found, manually insert:
```sql
INSERT INTO users (clerk_id, email, first_name, last_name, role, active)
VALUES (
  'user_34AGg4jwcrXhzUhhtI3BKPkzfU3',
  'shijonwebsitebuilder@gmail.com',
  'Don',
  'SDR',
  'bdr',
  true
);
```

## Common Errors and Solutions

### Error: "Webhook secret not configured"
**Cause:** Missing `CLERK_WEBHOOK_SECRET` in Vercel
**Fix:** Add environment variable in Vercel and redeploy

### Error: "Invalid signature"
**Cause:**
- Wrong secret
- URL redirect breaking signature
- URL mismatch between Clerk and actual endpoint

**Fix:**
- Use exact URL with www: `https://www.seodonscrm.co.uk/api/webhook/clerk`
- Copy secret exactly as shown in Clerk

### Error: "Processing failed"
**Cause:** Database error (missing columns, RLS policy issue)
**Fix:**
- Run the SQL migration first
- Check Vercel logs for specific error

## Quick Test Command
```bash
# Test if endpoint is reachable (from terminal)
curl -X POST https://www.seodonscrm.co.uk/api/webhook/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Should return 400 (missing svix headers) - that's good, means endpoint works!

## What to Send Me
If still not working, send me:
1. Screenshot of Vercel logs when creating a user
2. Screenshot of Clerk webhook delivery attempt
3. Result of this SQL query: `SELECT clerk_id, email, role FROM users;`
