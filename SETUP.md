# SEO Dons Dashboard - Complete Setup Guide

This guide will walk you through setting up the sales dashboard from scratch.

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 18
- Supabase client
- Clerk authentication
- Tailwind CSS
- Recharts for data visualization
- And more...

## Step 2: Set Up Supabase

### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - Choose a name (e.g., "seo-dons-dashboard")
   - Set a strong database password
   - Choose a region close to your users

### Configure Database

1. Wait for your project to finish setting up (~2 minutes)
2. Navigate to **SQL Editor** in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `supabase-schema.sql`
5. Paste into the SQL editor
6. Click "Run" to execute the schema

This will create:
- All database tables (users, deals, activities, etc.)
- Row Level Security policies
- Indexes for performance
- Triggers for automatic commission creation
- Seed data for achievements

### Get API Keys

1. Go to **Settings** → **API** in your Supabase project
2. Copy these values for your `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 3: Set Up Clerk Authentication

### Create Clerk Application

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up or log in
3. Click "Add application"
4. Choose a name (e.g., "SEO Dons Dashboard")
5. Select "Email" as authentication method
6. Click "Create application"

### Configure Clerk

1. In your Clerk dashboard, go to **Configure** → **Email, Phone, Username**
2. Enable "Email address" and "Password"
3. Go to **Configure** → **Paths**
4. Set these paths:
   - Sign-in page: `/sign-in`
   - Sign-up page: `/sign-up`
   - After sign-in redirect: `/dashboard`

### Get API Keys

1. Go to **API Keys** in Clerk dashboard
2. Copy these values for your `.env.local`:
   - Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret Key → `CLERK_SECRET_KEY`

## Step 4: Configure Environment Variables

1. Copy the example file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in your values:

```bash
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk (from Step 3)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# HubSpot (optional - can set up later)
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_ACCESS_TOKEN=

# Slack (optional - can set up later)
SLACK_WEBHOOK_URL=
SLACK_BOT_TOKEN=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Sync Clerk Users with Supabase

You'll need to create a webhook in Clerk to sync users to Supabase.

### Create Sync Webhook (Optional for MVP)

For now, you can manually create users in Supabase after they sign up in Clerk. Later, set up a Clerk webhook to automatically sync users.

Manual user creation in Supabase:

```sql
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES ('user_xxxxx', 'john@example.com', 'John', 'Doe', 'bdr');
```

## Step 6: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see a redirect to the sign-in page.

## Step 7: Create Your First User

1. Click "Sign up"
2. Enter email and password
3. Complete registration
4. You'll be redirected to `/dashboard`

**Note:** The dashboard may show empty data initially. You'll need to add the user to your Supabase `users` table manually for the first user.

## Step 8: Add Test Data (Optional)

To test the dashboard with sample data:

```sql
-- Create a test user in Supabase (use your actual Clerk user ID)
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES ('user_xxxxx', 'test@example.com', 'Test', 'User', 'bdr')
RETURNING id;

-- Create a test customer
INSERT INTO customers (email, first_name, last_name, company)
VALUES ('customer@example.com', 'Jane', 'Smith', 'Acme Corp')
RETURNING id;

-- Create a test deal (use the user ID from above)
INSERT INTO deals (
  assigned_to,
  customer_id,
  deal_name,
  deal_value,
  stage,
  expected_close_date
)
VALUES (
  'user-uuid-from-above',
  'customer-uuid-from-above',
  'Website SEO Package',
  5000.00,
  'proposal',
  CURRENT_DATE + INTERVAL '30 days'
);

-- Create a test call activity
INSERT INTO activities (
  user_id,
  activity_type,
  subject,
  outcome,
  duration_minutes,
  completed_at
)
VALUES (
  'user-uuid-from-above',
  'call',
  'Initial discovery call',
  'successful',
  30,
  NOW()
);
```

## Step 9: Set Up HubSpot Integration (Optional)

### Create HubSpot Private App

1. Go to HubSpot Settings → Integrations → Private Apps
2. Click "Create private app"
3. Name it "SEO Dons Dashboard"
4. Go to **Scopes** tab
5. Select these scopes:
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
6. Click "Create app"
7. Copy the access token → `HUBSPOT_ACCESS_TOKEN` in `.env.local`

### Configure Webhook

1. In HubSpot, go to Settings → Integrations → Webhooks
2. Click "Create webhook subscription"
3. Set webhook URL: `https://your-app.netlify.app/api/webhook/hubspot`
4. Subscribe to these events:
   - Deal stage changed
   - Deal amount changed
5. Save the subscription

## Step 10: Set Up Slack Notifications (Optional)

### Create Slack Webhook

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "SEO Dons Dashboard"
4. Choose your workspace
5. Go to **Incoming Webhooks**
6. Activate incoming webhooks
7. Click "Add New Webhook to Workspace"
8. Choose a channel
9. Copy the webhook URL → `SLACK_WEBHOOK_URL` in `.env.local`

## Step 11: Deploy to Netlify

### Option A: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Option B: Deploy via Git

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Netlify will auto-detect Next.js settings
6. Add environment variables in Site Settings → Environment Variables
7. Deploy!

### Post-Deployment

1. Update `.env.local` with your production URL:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
   ```

2. Update Clerk settings:
   - Add production domain to allowed origins
   - Update redirect URLs

3. Update HubSpot webhook URL to production domain

## Troubleshooting

### "Database error" when loading dashboard

- Check that you ran the `supabase-schema.sql` script
- Verify your Supabase environment variables are correct
- Check Supabase logs in the dashboard

### "Unauthorized" on Clerk authentication

- Verify Clerk environment variables
- Check that redirect URLs match your domain
- Clear browser cookies and try again

### HubSpot sync not working

- Verify access token has correct scopes
- Check webhook signature verification
- Review Netlify function logs

### Real-time updates not working

- Check Supabase Realtime is enabled in project settings
- Verify WebSocket connection in browser DevTools
- Check for CORS issues

## Next Steps

1. ✅ Complete the setup above
2. 📝 Customize the dashboard for your team
3. 👥 Invite team members via Clerk
4. 📊 Start logging calls and deals
5. 🏆 Watch your team compete on the leaderboard!

## Development Workflow

```bash
# Start development
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Run tests (when implemented)
npm test
```

## Getting Help

- Check the [README.md](README.md) for more details
- Review the [Technical Specification](../specification.md)
- Contact your development team

---

🎉 **Congratulations!** Your SEO Dons Dashboard is now set up and ready to use!
