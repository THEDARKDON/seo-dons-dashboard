# Clerk Webhook Setup - LOCAL DEVELOPMENT ONLY

⚠️ **THIS IS FOR LOCAL DEVELOPMENT TESTING - NOT PRODUCTION**

## Step-by-Step Instructions

### Step 1: Add Webhook Secret to .env.local

1. Open `D:\LeaderBoard and Audit Site\.env.local` in your editor
2. Add this line at the bottom:
```env
CLERK_WEBHOOK_SECRET=whsec_temp_placeholder
```
3. Save the file (we'll update this with the real secret in Step 5)

---

### Step 2: Install and Start ngrok

ngrok creates a public URL that tunnels to your localhost so Clerk can reach your local server.

1. **Download ngrok:**
   - Go to https://ngrok.com/download
   - Download for Windows
   - Extract `ngrok.exe` to any folder

2. **Start ngrok** (keep this terminal open):
```bash
ngrok http 3000
```

3. **Copy the HTTPS URL** from the ngrok output:
   - Look for: `Forwarding https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:3000`
   - Copy the HTTPS URL (e.g., `https://1a2b-3c4d-5e6f.ngrok-free.app`)
   - **IMPORTANT:** It must be HTTPS, not HTTP

**Example ngrok output:**
```
ngrok

Session Status                online
Account                       your@email.com
Forwarding                    https://1a2b-3c4d-5e6f.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```
**Copy this URL:** `https://1a2b-3c4d-5e6f.ngrok-free.app`

---

### Step 3: Restart Your Dev Server

The dev server needs to reload the new environment variable.

1. Go to your terminal running `npm run dev`
2. Press `CTRL + C` to stop it
3. Run again:
```bash
npm run dev
```

---

### Step 4: Configure Webhook in Clerk Dashboard

1. **Go to Clerk Dashboard:**
   - Open https://dashboard.clerk.com
   - Select your application (the one with publishable key: `pk_test_Ym9zcy1zbHVnLTE1...`)

2. **Navigate to Webhooks:**
   - Click **"Webhooks"** in the left sidebar
   - Click **"+ Add Endpoint"** button

3. **Enter Endpoint URL:**
   - **Endpoint URL:** `https://YOUR-NGROK-URL/api/webhook/clerk`
   - Example: `https://1a2b-3c4d-5e6f.ngrok-free.app/api/webhook/clerk`
   - ⚠️ Replace `YOUR-NGROK-URL` with your actual ngrok URL from Step 2
   - ⚠️ Make sure `/api/webhook/clerk` is at the end

4. **Subscribe to Events:**
   - Scroll down to "Subscribe to events"
   - Find and check these three events:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`

5. **Click "Create" button**

---

### Step 5: Copy Signing Secret to .env.local

1. After creating the webhook, you'll see your webhook endpoint listed
2. Click on your newly created webhook endpoint
3. You'll see a **"Signing Secret"** section
4. Click **"Reveal"** or copy button next to the secret
   - It will look like: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx`

5. **Update .env.local:**
   - Open `D:\LeaderBoard and Audit Site\.env.local`
   - Find the line: `CLERK_WEBHOOK_SECRET=whsec_temp_placeholder`
   - Replace with your actual secret: `CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here`
   - Save the file

6. **Restart dev server again:**
   - Press `CTRL + C` in the terminal running `npm run dev`
   - Run `npm run dev` again

---

### Step 6: Test the Webhook

**Option A: Create a Test User in Clerk Dashboard**

1. Go to Clerk Dashboard > **Users** (left sidebar)
2. Click **"+ Create User"** button
3. Fill in:
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Password: `TestPassword123!`
4. Click **"Create"**

**Option B: Sign Up Through Your App**

1. Go to http://localhost:3000
2. Sign out if logged in
3. Go to http://localhost:3000/sign-up
4. Create a new account

---

### Step 7: Verify It Worked

**Check 1: Look at your terminal running `npm run dev`**

You should see log output like:
```
✅ User synced to Supabase: { id: '...', clerk_id: 'user_...', email: 'test@example.com' }
```

**Check 2: Verify in Supabase**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"Table Editor"** (left sidebar)
4. Click **"users"** table
5. You should see the new user in the list

**Check 3: Check Clerk Webhook Logs**

1. Go to Clerk Dashboard > Webhooks
2. Click your webhook endpoint
3. Scroll to **"Recent Attempts"**
4. You should see successful webhook deliveries (green checkmarks)

---

## Common Issues

### Issue: "Webhook secret not configured"
- Make sure `CLERK_WEBHOOK_SECRET` is in `.env.local`
- Restart the dev server after adding it

### Issue: "Invalid signature"
- The signing secret doesn't match
- Copy the correct secret from Clerk Dashboard
- Make sure there are no extra spaces
- Restart dev server

### Issue: ngrok URL not working
- Make sure you're using the HTTPS URL, not HTTP
- ngrok must be running
- Try visiting `https://your-ngrok-url.ngrok-free.app` in a browser - you should see your app

### Issue: No logs appearing
- Check that your dev server is running
- Check that ngrok is running
- Verify the webhook URL in Clerk has `/api/webhook/clerk` at the end

### Issue: User not appearing in Supabase
- Check terminal for error messages
- Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Check Supabase table structure matches expected columns

---

## Your Current URLs

- **Your App:** http://localhost:3000
- **Your ngrok URL:** (get from Step 2) `https://xxxx-xxxx-xxxx.ngrok-free.app`
- **Webhook Endpoint:** `https://xxxx-xxxx-xxxx.ngrok-free.app/api/webhook/clerk`

---

## Important Notes

⚠️ **ngrok URL Changes Every Time**
- Each time you restart ngrok, you get a NEW URL
- You must update the webhook URL in Clerk Dashboard each time
- For a permanent URL, you need a paid ngrok plan OR deploy to production

⚠️ **This is Local Development Only**
- This setup only works while ngrok and your dev server are running
- For production (Netlify), you'll use: `https://your-site.netlify.app/api/webhook/clerk`

✅ **Your Existing User**
- Don Fawcett (fawcettfinances@gmail.com) is already in the database
- You don't need to do anything for your existing account
- This webhook is for NEW users who sign up

---

## Quick Reference

**Start everything:**
```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Terminal 2: Start dev server
npm run dev
```

**Environment variables needed in .env.local:**
```env
CLERK_WEBHOOK_SECRET=whsec_your_secret_from_clerk_dashboard
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (already there)
```

---

## Next Steps After Setup

Once the webhook is working:
1. Any new user who signs up will automatically appear in Supabase
2. They can immediately create deals, log calls, etc.
3. No manual user creation needed

When you're ready for production:
1. Deploy to Netlify
2. Update webhook URL to: `https://your-site.netlify.app/api/webhook/clerk`
3. Add `CLERK_WEBHOOK_SECRET` to Netlify environment variables
