# Quick Start Guide

Get your SEO Dons Dashboard running in 10 minutes!

## Prerequisites

- Node.js 20+ installed
- A Supabase account (free tier works!)
- A Clerk account (free tier works!)

## 1. Install Dependencies (2 min)

```bash
npm install
```

## 2. Set Up Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Wait for it to initialize
3. Go to SQL Editor → Run the `supabase-schema.sql` file
4. Go to Settings → API and copy:
   - Project URL
   - anon public key

## 3. Set Up Clerk (2 min)

1. Go to [clerk.com](https://clerk.com) and create an application
2. Enable "Email + Password" authentication
3. Copy your API keys from the dashboard

## 4. Configure Environment (1 min)

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your keys from steps 2 & 3.

## 5. Start the App (30 sec)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 6. Create Your First User (1 min)

1. Click "Sign up"
2. Create an account
3. After signing in, you'll see the dashboard!

**Note:** You'll need to manually add the user to Supabase for full functionality:

```sql
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES ('your_clerk_user_id', 'your_email@example.com', 'John', 'Doe', 'bdr');
```

Get your Clerk user ID from the Clerk dashboard under Users.

## What's Next?

- **Add test data:** See [SETUP.md](SETUP.md) for SQL scripts to add sample deals and calls
- **Customize:** Modify components in `components/dashboard/`
- **Deploy:** Follow the Netlify deployment guide in [SETUP.md](SETUP.md)
- **Integrate HubSpot:** Set up the HubSpot integration (optional)

## Project Structure

```
├── app/                  # Next.js routes
├── components/           # React components
├── lib/                  # Utilities and services
│   ├── supabase/        # Database client
│   ├── integrations/    # HubSpot, Slack
│   └── services/        # Business logic
└── supabase-schema.sql  # Database schema
```

## Key Features Already Built

✅ Authentication with Clerk
✅ Database schema with Supabase
✅ Commission calculator (50% first month, 10% ongoing)
✅ Leaderboard component with real-time updates
✅ HubSpot integration service
✅ Webhook handlers
✅ Netlify deployment config

## Need Help?

- Read the full [SETUP.md](SETUP.md) guide
- Check the [README.md](README.md) for detailed documentation
- Review the original specification document

## Common Issues

**"Database error"**
→ Make sure you ran the SQL schema in Supabase

**"Unauthorized"**
→ Check your Clerk environment variables

**Empty dashboard**
→ Add your user to the Supabase `users` table

---

Happy coding! 🚀
