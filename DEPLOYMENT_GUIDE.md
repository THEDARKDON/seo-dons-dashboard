# Deployment Guide - Netlify Production

This guide walks you through deploying the SEO Dons Dashboard to production on Netlify.

## Prerequisites

Before deploying, make sure you have:

- ✅ Local environment working (see `LOCAL_SETUP.md`)
- ✅ Supabase project set up
- ✅ Clerk application configured
- ✅ Git repository initialized
- ✅ GitHub account (recommended) or Netlify CLI installed

## Option 1: Deploy via Netlify UI (Recommended)

### Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init

# Create .gitignore if needed
echo "node_modules/" >> .gitignore
echo ".env.local" >> .gitignore
echo ".next/" >> .gitignore

# Add all files
git add .

# Commit
git commit -m "Initial commit - SEO Dons Dashboard"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/seo-dons-dashboard.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to [https://netlify.com](https://netlify.com)
2. Sign up or log in
3. Click "Add new site" → "Import an existing project"
4. Click "GitHub" (or your preferred Git provider)
5. Authorize Netlify to access your repos
6. Select your `seo-dons-dashboard` repository

### Step 3: Configure Build Settings

Netlify should auto-detect Next.js. Verify these settings:

```
Build command: npm run build
Publish directory: .next
```

**Do NOT deploy yet!** Click "Add environment variables" first.

### Step 4: Add Environment Variables

Click "Add environment variables" and add all of these:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx  # Use LIVE keys for production!
CLERK_SECRET_KEY=sk_live_xxxxx

# Optional (leave blank if not using)
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_ACCESS_TOKEN=
APOLLO_API_KEY=
SLACK_WEBHOOK_URL=
SLACK_BOT_TOKEN=
RESEND_API_KEY=

# App URL (you'll update this after deployment)
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

**Important**: Use production/live keys for Clerk, not test keys!

### Step 5: Deploy

1. Click "Deploy site"
2. Wait 2-5 minutes for build to complete
3. You'll see "Site is live" when ready
4. Click on the site URL (e.g., `https://magical-unicorn-123456.netlify.app`)

### Step 6: Update App URL

1. Copy your Netlify site URL
2. Go back to Netlify → **Site configuration** → **Environment variables**
3. Find `NEXT_PUBLIC_APP_URL`
4. Update it to your actual Netlify URL: `https://your-app.netlify.app`
5. Click "Save"
6. Trigger a redeploy: **Deploys** → **Trigger deploy** → **Deploy site**

### Step 7: Configure Clerk for Production

1. Go to Clerk dashboard → Your application
2. Click **Domains** in the sidebar
3. Add your Netlify domain:
   - Domain: `https://your-app.netlify.app`
   - Click "Add domain"
4. Go to **Paths**
5. Update redirect URLs to use your production domain
6. Go to **API Keys**
7. Make sure you're using **Production keys** (not Development)

### Step 8: Test Production Deployment

1. Open your Netlify site URL
2. You should see the sign-in page
3. Try signing up with a new account
4. You'll need to add this user to Supabase (see below)

### Step 9: Add Production Users to Supabase

For each new user that signs up:

1. Get their Clerk User ID from Clerk dashboard → Users
2. Go to Supabase → SQL Editor
3. Run:

```sql
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES (
  'user_xxxxx',  -- Clerk User ID
  'user@example.com',
  'First',
  'Last',
  'bdr'  -- or 'manager' or 'admin'
);
```

**Note**: For production, you'll want to automate this with a Clerk webhook (see Advanced section below).

---

## Option 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This opens a browser window. Click "Authorize" to connect CLI to your account.

### Step 3: Initialize Site

```bash
netlify init
```

Follow the prompts:
- Create & configure a new site
- Choose your team
- Site name: `seo-dons-dashboard` (or your preferred name)
- Build command: `npm run build`
- Directory to deploy: `.next`

### Step 4: Set Environment Variables

```bash
# Set each variable
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGci..."
netlify env:set SUPABASE_SERVICE_ROLE_KEY "eyJhbGci..."
netlify env:set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY "pk_live_xxxxx"
netlify env:set CLERK_SECRET_KEY "sk_live_xxxxx"

# Or set them all at once in the Netlify UI
netlify open
```

### Step 5: Deploy

```bash
# Deploy to production
netlify deploy --prod
```

Wait for deployment to complete, then open the provided URL.

---

## Post-Deployment Tasks

### 1. Set Up Custom Domain (Optional)

1. Buy a domain (e.g., `dashboard.seodon.com`)
2. In Netlify → **Domain settings** → **Add custom domain**
3. Follow instructions to configure DNS
4. Netlify automatically provisions SSL certificate
5. Update environment variables:
   - `NEXT_PUBLIC_APP_URL=https://dashboard.seodons.com`
6. Update Clerk allowed domains

### 2. Configure HubSpot Webhook (If Using)

1. Go to HubSpot → Settings → Integrations → Webhooks
2. Create webhook subscription
3. Target URL: `https://your-app.netlify.app/api/webhook/hubspot`
4. Subscribe to:
   - Deal property changed
   - Deal created
5. Test webhook delivery

### 3. Set Up Monitoring

#### Netlify Analytics
- Go to Netlify → **Analytics**
- Enable Netlify Analytics ($9/month)
- Monitor traffic, performance, errors

#### Error Tracking (Optional - Sentry)
1. Sign up for Sentry (free tier available)
2. Create new project (Next.js)
3. Install SDK:
```bash
npm install @sentry/nextjs
```
4. Follow setup wizard
5. Deploy again

### 4. Set Up Backups

Your Supabase database includes automatic backups on Pro plan. To enable:

1. Go to Supabase → **Settings** → **Database**
2. Enable **Point-in-Time Recovery** (Pro plan)
3. Set backup retention period

### 5. Configure Slack Notifications

1. Create Slack incoming webhook
2. Add `SLACK_WEBHOOK_URL` to Netlify environment variables
3. Redeploy
4. Test by closing a deal - you should get a Slack notification!

---

## Production Checklist

Before going live with real users:

- [ ] All environment variables set correctly
- [ ] Using Clerk PRODUCTION keys (not test keys)
- [ ] SSL certificate working (https://)
- [ ] Clerk redirect URLs updated
- [ ] Database connection working
- [ ] Real-time updates working
- [ ] Test user signup flow
- [ ] Test deal creation
- [ ] Test call logging
- [ ] Test commission calculation
- [ ] Test leaderboard updates
- [ ] HubSpot webhook configured (if using)
- [ ] Slack notifications working (if using)
- [ ] Error tracking set up
- [ ] Backups configured
- [ ] Domain DNS configured (if using custom domain)

---

## Monitoring & Maintenance

### Check Build Status

```bash
# Via CLI
netlify status

# Or visit Netlify dashboard
# https://app.netlify.com/sites/YOUR_SITE/deploys
```

### View Logs

```bash
# Function logs
netlify functions:log

# Build logs
# Available in Netlify UI under Deploys → [specific deploy] → Deploy log
```

### Redeploy

```bash
# Trigger redeploy without changes
netlify deploy --prod

# Or in Netlify UI
# Deploys → Trigger deploy → Clear cache and deploy site
```

### Update Environment Variables

```bash
# Via CLI
netlify env:set VARIABLE_NAME "new-value"

# Then redeploy
netlify deploy --prod
```

---

## Troubleshooting Production Issues

### Build Fails

**Error**: `Module not found`

**Solution**:
```bash
# Make sure all dependencies are in package.json
npm install missing-package
git commit -am "Add missing dependency"
git push
```

**Error**: `Environment variable not defined`

**Solution**: Check Netlify environment variables are all set

### Runtime Errors

**Error**: "Unauthorized" or authentication issues

**Solution**:
- Check Clerk keys are PRODUCTION keys
- Verify Clerk domain is added
- Check redirect URLs in Clerk

**Error**: Database connection fails

**Solution**:
- Verify Supabase environment variables
- Check Supabase project is not paused
- Test connection string manually

### Real-time Not Working

**Solution**:
1. Check Supabase Realtime is enabled
2. Verify WebSocket connections in browser DevTools
3. Check for CORS issues
4. Ensure RLS policies allow reads

---

## Advanced: Automate User Creation with Clerk Webhooks

To automatically create Supabase users when someone signs up via Clerk:

### 1. Create Webhook Endpoint

Create `app/api/webhook/clerk/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Webhook } from 'svix';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const headers = {
    'svix-id': request.headers.get('svix-id')!,
    'svix-timestamp': request.headers.get('svix-timestamp')!,
    'svix-signature': request.headers.get('svix-signature')!,
  };

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const event = webhook.verify(payload, headers);

    if (event.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = event.data;

      const supabase = createClient();
      await supabase.from('users').insert({
        clerk_id: id,
        email: email_addresses[0].email_address,
        first_name: first_name || '',
        last_name: last_name || '',
        role: 'bdr',
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
```

### 2. Configure Clerk Webhook

1. Go to Clerk → **Webhooks**
2. Add endpoint: `https://your-app.netlify.app/api/webhook/clerk`
3. Subscribe to `user.created` event
4. Copy webhook secret
5. Add to Netlify env vars: `CLERK_WEBHOOK_SECRET`
6. Redeploy

Now users are automatically created in Supabase when they sign up!

---

## Performance Optimization

After deployment, monitor and optimize:

### 1. Enable Caching

Your `netlify.toml` already includes cache headers. Verify they're working:

```bash
curl -I https://your-app.netlify.app/_next/static/...
# Should see: Cache-Control: public, max-age=31536000, immutable
```

### 2. Optimize Images

Use Next.js Image component everywhere:

```typescript
import Image from 'next/image';

<Image src="/logo.png" width={200} height={50} alt="Logo" />
```

### 3. Monitor Bundle Size

```bash
npm run build
```

Check output for bundle sizes. Keep main bundle < 200KB.

### 4. Add Loading States

Make sure all pages have proper loading skeletons to improve perceived performance.

---

## 🎉 Congratulations!

Your SEO Dons Dashboard is now live in production!

**Next Steps**:
1. Invite your team to sign up
2. Add them to Supabase (or set up Clerk webhook)
3. Start tracking deals and calls
4. Monitor the leaderboard
5. Iterate based on feedback

**Need Help?**
- Check Netlify deployment logs
- Review Supabase logs
- Check Clerk event logs
- Review `TROUBLESHOOTING.md` (if you create one)

---

**Deployment Complete!** 🚀

Last Updated: 2025-09-30
