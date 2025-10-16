# Local Development Setup & Testing Guide

This guide will help you set up your local environment and test the application with sample data.

## Prerequisites

- Node.js 20+ installed
- A Supabase account (free tier works!)
- A Clerk account (free tier works!)
- Git (for version control)

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages. It may take 2-3 minutes.

## Step 2: Set Up Supabase

### Create Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project:
   - Name: `seo-dons-dashboard`
   - Database Password: Choose a strong password (save this!)
   - Region: Choose closest to you
4. Wait ~2 minutes for setup

### Run Database Schema

1. Once your project is ready, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open the file `supabase-schema.sql` in your text editor
4. Copy ALL the contents
5. Paste into Supabase SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

This creates:
- All database tables
- Row Level Security policies
- Automatic triggers
- Performance indexes
- Sample achievements

### Get API Keys

1. Go to **Settings** → **API** in Supabase
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Set Up Clerk Authentication

### Create Application

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up or log in
3. Click "+ Add application"
4. Name: "SEO Dons Dashboard"
5. Select authentication methods:
   - ✅ Email
   - ✅ Password
6. Click "Create application"

### Configure Settings

1. Go to **User & Authentication** → **Email, Phone, Username**
2. Make sure "Email address" is enabled
3. Make sure "Password" is enabled

### Get API Keys

1. Go to **API Keys** in Clerk dashboard
2. Copy these values:

```
Publishable key: pk_test_xxxxx
Secret key: sk_test_xxxxx
```

## Step 4: Configure Environment Variables

1. Copy the example file:

```bash
cp .env.local.example .env.local
```

2. Open `.env.local` in your editor and fill in:

```bash
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Clerk (from Step 3)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Leave these blank for now (optional integrations)
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_ACCESS_TOKEN=
APOLLO_API_KEY=
SLACK_WEBHOOK_URL=
SLACK_BOT_TOKEN=
RESEND_API_KEY=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

## Step 5: Start the Development Server

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

## Step 6: Create Your First User

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You'll be redirected to `/sign-in`
3. Click "Sign up"
4. Enter:
   - Email: your-email@example.com
   - Password: (choose a password)
5. Click "Continue"
6. You'll be redirected to `/dashboard`

**Important**: The dashboard will be empty because you're not in the Supabase `users` table yet!

## Step 7: Add User to Supabase

We need to manually create a user record in Supabase that matches your Clerk user.

### Get Your Clerk User ID

1. Go to Clerk dashboard → **Users**
2. Click on your user
3. Copy the **User ID** (looks like `user_2abc123xyz`)

### Add User to Supabase

1. Go to Supabase → **SQL Editor**
2. Run this query (replace values with yours):

```sql
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES (
  'user_2abc123xyz',  -- Your Clerk User ID
  'your-email@example.com',  -- Your email
  'John',  -- Your first name
  'Doe',  -- Your last name
  'bdr'  -- Your role (bdr, manager, or admin)
);
```

3. Click **Run**
4. Refresh your dashboard at [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
5. You should now see the dashboard!

## Step 8: Add Test Data

Let's add some sample data to test the dashboard.

### Add a Test Customer

```sql
INSERT INTO customers (email, first_name, last_name, company, phone)
VALUES (
  'jane.smith@acmecorp.com',
  'Jane',
  'Smith',
  'Acme Corporation',
  '+1-555-0123'
)
RETURNING id;
```

Copy the returned `id` value.

### Add a Test Deal

Replace `YOUR_USER_ID` with your user ID from the users table and `CUSTOMER_ID` with the customer ID from above:

```sql
INSERT INTO deals (
  assigned_to,
  customer_id,
  deal_name,
  deal_value,
  stage,
  probability,
  expected_close_date,
  source
)
VALUES (
  'YOUR_USER_ID',  -- Get this from: SELECT id FROM users WHERE clerk_id = 'your_clerk_id';
  'CUSTOMER_ID',  -- From previous query
  'Acme Corp - SEO Package',
  5000.00,
  'proposal',
  75,
  CURRENT_DATE + INTERVAL '30 days',
  'Cold Call'
);
```

### Add Test Calls

```sql
INSERT INTO activities (
  user_id,
  customer_id,
  activity_type,
  subject,
  description,
  outcome,
  duration_minutes,
  completed_at
)
VALUES
  (
    'YOUR_USER_ID',
    'CUSTOMER_ID',
    'call',
    'Initial discovery call',
    'Discussed their SEO needs and current challenges. They are interested in our premium package.',
    'successful',
    25,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'YOUR_USER_ID',
    'CUSTOMER_ID',
    'call',
    'Follow-up call',
    'Sent proposal, discussed pricing and timeline.',
    'callback_scheduled',
    15,
    NOW() - INTERVAL '1 day'
  );
```

### Create a Closed Deal (to see commissions)

```sql
-- Create a won deal
INSERT INTO deals (
  assigned_to,
  customer_id,
  deal_name,
  deal_value,
  stage,
  actual_close_date
)
VALUES (
  'YOUR_USER_ID',
  'CUSTOMER_ID',
  'Acme Corp - Premium SEO',
  10000.00,
  'closed_won',  -- This triggers automatic commission creation!
  CURRENT_DATE
);
```

The database trigger will automatically create two commission records:
- First month: $5,000 (50%)
- Ongoing: $1,000/month (10%)

### Add More Users for Leaderboard

```sql
-- Create a second user (use a different Clerk ID or fake one for testing)
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES ('user_test123', 'sarah@example.com', 'Sarah', 'Johnson', 'bdr');

-- Create a won deal for them
INSERT INTO deals (
  assigned_to,
  deal_name,
  deal_value,
  stage,
  actual_close_date
)
VALUES (
  (SELECT id FROM users WHERE email = 'sarah@example.com'),
  'Big Corp Deal',
  15000.00,
  'closed_won',
  CURRENT_DATE
);
```

## Step 9: Test the Dashboard

Refresh your dashboard and explore:

### Dashboard Home
- Should show your metrics (calls, deals, revenue)
- Activity feed shows recent calls
- Leaderboard shows rankings
- Recent deals listed

### Deals Page
- Click "Deals" in sidebar
- You should see your test deals
- Click on a deal to see details
- Try creating a new deal using the form

### Calls Page
- Click "Calls" in sidebar
- See your logged calls
- Click "Log Call" to add a new one
- Watch your daily call count update

### Commissions Page
- Click "Commissions" in sidebar
- See commissions from closed deals
- View pending/approved/paid breakdown

### Leaderboard Page
- Click "Leaderboard" in sidebar
- See real-time rankings
- Try closing another deal and watch it update!

## Step 10: Test Real-time Updates

1. Open your dashboard in two browser windows side by side
2. In one window, go to Supabase SQL Editor
3. Run this query to "close" a deal:

```sql
UPDATE deals
SET stage = 'closed_won', actual_close_date = CURRENT_DATE
WHERE stage != 'closed_won'
LIMIT 1;
```

4. Watch the leaderboard in your dashboard update in real-time! 🎉

## Troubleshooting

### "Database error" on dashboard

**Problem**: User not in Supabase database

**Solution**: Complete Step 7 - Add your user to the `users` table

### "Unauthorized" error

**Problem**: Environment variables incorrect

**Solution**:
- Check `.env.local` has correct Clerk keys
- Make sure you copied them exactly
- Restart dev server: `npm run dev`

### Dashboard shows no data

**Problem**: No test data added

**Solution**: Complete Step 8 - Add test data

### Real-time updates not working

**Problem**: Supabase Realtime not enabled

**Solution**:
1. Go to Supabase → **Settings** → **API**
2. Scroll to "Realtime"
3. Make sure it's enabled (toggle should be green)

### "Cannot find module" errors

**Problem**: Dependencies not installed

**Solution**: Run `npm install` again

## Next Steps

Now that your local environment is set up:

1. **Explore the code**: Check out the components in `components/dashboard/`
2. **Add features**: Follow the `CHECKLIST.md` for next steps
3. **Customize**: Update colors, branding, etc.
4. **Deploy**: When ready, follow `DEPLOYMENT_GUIDE.md`

## Quick Reference

### Useful Commands

```bash
# Start dev server
npm run dev

# Install new package
npm install package-name

# Check for linting errors
npm run lint

# Build for production (test)
npm run build
```

### Useful SQL Queries

```sql
-- Get your Supabase user ID
SELECT id FROM users WHERE clerk_id = 'YOUR_CLERK_ID';

-- See all your deals
SELECT * FROM deals WHERE assigned_to = 'YOUR_USER_ID';

-- See all activities
SELECT * FROM activities WHERE user_id = 'YOUR_USER_ID';

-- See all commissions
SELECT * FROM commissions WHERE user_id = 'YOUR_USER_ID';

-- Reset test data
DELETE FROM activities WHERE user_id = 'YOUR_USER_ID';
DELETE FROM deals WHERE assigned_to = 'YOUR_USER_ID';
DELETE FROM commissions WHERE user_id = 'YOUR_USER_ID';
```

---

## 🎉 You're Ready to Develop!

Your local environment is now fully set up and working. Happy coding!

**Need help?** Check the other documentation files:
- `IMPLEMENTATION_NOTES.md` - Code patterns and tips
- `ARCHITECTURE.md` - System design
- `CHECKLIST.md` - Development tasks

---

Last Updated: 2025-09-30
