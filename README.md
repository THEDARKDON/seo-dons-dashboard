# SEO Dons CRM - Complete Sales Platform

A modern, full-featured CRM built with Next.js 15, Supabase, and Clerk, featuring integrated calling, LinkedIn automation, AI-powered coaching, and gamification.

**🚀 Cost Savings: 78% cheaper than JustCall ($1,035/mo vs $4,660/mo for 10 users)**

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + React 18 + TypeScript + Tailwind CSS
- **UI:** shadcn/ui + Radix UI
- **Database:** Supabase (PostgreSQL) with RLS
- **Authentication:** Clerk (JWT tokens)
- **Calling:** SignalWire ($0.00345/min)
- **AI:** OpenAI (Whisper + GPT-4)
- **Social Media:** LinkedIn API
- **Hosting:** Vercel

## Features

### ✅ Core CRM (Phases 1-3)
- 📊 Real-time sales dashboard with 5 key metrics
- 🎯 Deal pipeline management with drag-drop stages
- 👥 Customer CRM with 360° view
- 📞 Call logging and activity tracking
- 📅 Appointment scheduling and calendar
- 💰 Commission tracking with automatic calculations
- 🏆 Gamification with achievements and streaks
- 📈 Analytics dashboard with revenue insights
- 🏅 Leaderboard with team rankings

### ✅ Calling Integration (Phase 4)
- ☎️ Click-to-call from any customer/deal page
- 🎙️ Automatic call recording
- 📝 AI transcription with OpenAI Whisper ($0.006/min)
- 😊 Sentiment analysis with GPT-4
- 🎓 AI-powered coaching insights
- 📚 Searchable call history with full transcripts
- 👮 TCPA/GDPR compliance tracking
- 📊 Call analytics and performance metrics

### ✅ LinkedIn Integration (Phase 6 - Partial)
- 🔗 OAuth connection with LinkedIn
- 📅 Post scheduling for future publication
- 📄 Content templates with variable insertion
- 📊 Engagement tracking (likes, comments, shares)
- 📱 Social media dashboard

### ⏳ Coming Soon
- Post composition UI
- Approval workflows for team posts
- Email/SMS sequences
- Lead enrichment (Clay/Apollo)
- Calendar booking integration

## Getting Started

### Prerequisites

- Node.js 20+ installed
- Supabase account
- Clerk account
- HubSpot account (optional)
- Slack workspace (optional)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key

3. **Set up Supabase database:**

- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Run the SQL script from `supabase-schema.sql`

4. **Configure Clerk:**

- Create a new application in Clerk
- Enable email/password authentication
- Copy your API keys to `.env.local`
- Configure allowed redirect URLs: `http://localhost:3000`

5. **Start development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

## Project Structure

```
├── app/                        # Next.js 15 App Router
│   ├── (auth)/                # Authentication routes
│   ├── (dashboard)/           # Dashboard routes
│   │   ├── deals/            # Deal management
│   │   ├── calls/            # Call logging
│   │   ├── appointments/     # Calendar
│   │   ├── commissions/      # Commission tracking
│   │   └── leaderboard/      # Team leaderboard
│   ├── api/                  # API routes
│   │   ├── webhook/          # Webhook handlers
│   │   └── sync/             # HubSpot sync
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── dashboard/            # Dashboard components
│   └── forms/                # Form components
├── lib/
│   ├── supabase/             # Supabase utilities
│   ├── integrations/         # HubSpot, Slack
│   ├── services/             # Business logic
│   └── utils.ts              # Helper functions
├── netlify.toml              # Netlify configuration
└── supabase-schema.sql       # Database schema
```

## HubSpot Integration

### Setup Webhook

1. Go to HubSpot > Settings > Integrations > Private Apps
2. Create a new private app with scopes: `crm.objects.deals.read`, `crm.objects.contacts.read`
3. Copy the access token to `.env.local` as `HUBSPOT_ACCESS_TOKEN`
4. Configure webhook URL: `https://your-app.netlify.app/api/webhook/hubspot`

### Manual Sync

Trigger a manual sync via API:

```bash
curl -X POST https://your-app.netlify.app/api/sync/hubspot \
  -H "Authorization: Bearer YOUR_SYNC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"syncType": "all"}'
```

## Commission Structure

- **First Month:** 50% of deal value
- **Ongoing:** 10% of deal value per month
- Commissions are automatically created when deals are marked as "Closed Won"
- Track commission status: Pending → Approved → Paid

## Deployment

### Deploy to Netlify

1. **Install Netlify CLI:**

```bash
npm install -g netlify-cli
```

2. **Login and initialize:**

```bash
netlify login
netlify init
```

3. **Set environment variables in Netlify:**

Go to Site Settings > Environment Variables and add all variables from `.env.local`

4. **Deploy:**

```bash
netlify deploy --prod
```

### Post-Deployment

1. Update Clerk redirect URLs with your Netlify domain
2. Update HubSpot webhook URL
3. Test real-time functionality
4. Monitor logs in Netlify dashboard

## Database Schema

Key tables:
- `users` - BDRs, managers, admins
- `teams` - Sales teams
- `customers` - Contacts/leads
- `deals` - Sales opportunities
- `activities` - Calls, emails, meetings
- `appointments` - Scheduled meetings
- `commissions` - Commission tracking
- `achievements` - Gamification badges
- `user_achievements` - Earned badges
- `streaks` - Activity streaks

See `supabase-schema.sql` for complete schema with triggers and RLS policies.

## Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e
```

## Development Roadmap

### Phase 1 (Completed)
- ✅ Project setup
- ✅ Database schema
- ✅ Authentication
- ✅ Basic services

### Phase 2 (Next)
- Dashboard UI
- Deal management
- Call logging
- Leaderboard

### Phase 3
- Appointments
- Commission dashboard
- Analytics
- HubSpot sync

### Phase 4
- Testing
- Performance optimization
- Documentation
- Launch

## Contributing

This is a private project. Contact the maintainer for contribution guidelines.

## License

Proprietary - SEO Dons

## Support

For support, email your development team or create an issue in the repository.

---

Built with ❤️ for SEO Dons
