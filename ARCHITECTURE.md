# SEO Dons Dashboard - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 15 Frontend (React)              │   │
│  │  • Dashboard • Deals • Calls • Appointments          │   │
│  │  • Leaderboard • Commission Tracker • Analytics      │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────┬─────────────────────────────────────┬───────────┘
            │                                     │
            ├─────── HTTP/REST ──────────────────┤
            │                                     │
            ▼                                     ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   Clerk Authentication  │          │   Next.js API Routes    │
│  • User Management      │          │  • /api/webhook/hubspot │
│  • JWT Tokens           │◄─────────┤  • /api/sync/hubspot   │
│  • Session Handling     │          │  • Serverless Functions │
└─────────────────────────┘          └──────────┬──────────────┘
                                                 │
                  ┌──────────────────────────────┼──────────────────────┐
                  │                              │                      │
                  ▼                              ▼                      ▼
    ┌─────────────────────────┐   ┌─────────────────────────┐  ┌─────────────────┐
    │    Supabase Database    │   │   HubSpot CRM API       │  │  Slack Webhooks │
    │  • PostgreSQL           │   │  • Deals Sync           │  │  • Notifications│
    │  • Real-time Updates    │   │  • Contact Sync         │  │  • Alerts       │
    │  • Row Level Security   │   │  • Webhooks             │  └─────────────────┘
    │  • Automatic Triggers   │   └─────────────────────────┘
    └─────────────────────────┘
                  ▲
                  │ WebSocket
                  │ (Real-time)
                  │
    ┌─────────────────────────┐
    │  Browser (Real-time)    │
    │  • Leaderboard Updates  │
    │  • Activity Feed        │
    │  • Notifications        │
    └─────────────────────────┘
```

## Data Flow

### 1. User Authentication Flow
```
User → Sign In Page → Clerk → JWT Token → Next.js Middleware → Protected Routes
```

### 2. Deal Creation Flow
```
User → Deal Form → Next.js API → Supabase → Database Trigger → Commission Records
                              └─→ HubSpot API → Create Deal in HubSpot
```

### 3. Real-time Leaderboard Update
```
Deal Closed → Supabase Update → Real-time Subscription → WebSocket →
Browser → Leaderboard Component Re-renders
```

### 4. HubSpot Webhook Flow
```
HubSpot → Webhook Event → /api/webhook/hubspot → Verify Signature →
Update Supabase → Real-time Update → UI Updates
```

## Database Schema Relationships

```
┌─────────┐         ┌──────────┐
│  Teams  │◄────┐   │  Users   │
└─────────┘     │   └──────────┘
                │        │
                └────────┤ assigned_to
                         │
                    ┌────▼─────┐
                    │  Deals   │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼─────┐   ┌────▼──────┐   ┌───▼──────────┐
    │Activities│   │Appointments│   │ Commissions  │
    └──────────┘   └───────────┘   └──────────────┘

┌──────────────┐         ┌─────────────────┐
│ Achievements │◄────────┤ User_Achievements│
└──────────────┘         └─────────────────┘

┌───────────┐
│  Streaks  │
└───────────┘
```

## Component Hierarchy

```
App Layout (Clerk Provider, Toaster)
│
├── Public Routes
│   ├── Home (/)
│   ├── Sign In (/sign-in)
│   └── Sign Up (/sign-up)
│
└── Protected Routes (Dashboard)
    ├── Dashboard Layout
    │   ├── Sidebar Navigation
    │   ├── Header
    │   └── Content Area
    │
    ├── Dashboard Home (/dashboard)
    │   ├── MetricCard (x4)
    │   ├── Leaderboard
    │   ├── ActivityFeed
    │   └── RecentDeals
    │
    ├── Deals (/dashboard/deals)
    │   ├── Deals List
    │   ├── Deal Detail (/deals/[id])
    │   └── New Deal (/deals/new)
    │
    ├── Calls (/dashboard/calls)
    │   ├── Call Log
    │   └── New Call (/calls/new)
    │
    ├── Appointments (/dashboard/appointments)
    │   ├── Calendar View
    │   └── New Appointment
    │
    ├── Commissions (/dashboard/commissions)
    │   ├── Commission Summary
    │   └── Commission History
    │
    ├── Leaderboard (/dashboard/leaderboard)
    │   └── Team Rankings
    │
    └── Analytics (/dashboard/analytics)
        ├── Revenue Chart
        ├── Conversion Funnel
        └── Activity Trends
```

## Service Layer Architecture

```
┌────────────────────────────────────────────────┐
│              Application Layer                  │
│  (React Components, Pages, UI Logic)           │
└───────────────┬────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────┐
│              Service Layer                      │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Commission       │  │ Achievement      │   │
│  │ Calculator       │  │ Tracker          │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
└───────────────┬────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────┐
│           Integration Layer                     │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │HubSpot  │  │ Slack   │  │ Resend  │        │
│  │Service  │  │Service  │  │Service  │        │
│  └─────────┘  └─────────┘  └─────────┘        │
│                                                 │
└───────────────┬────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────┐
│              Data Layer                         │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Supabase Client  │  │ Supabase Server  │   │
│  │ (Browser)        │  │ (Server-side)    │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────┐
│  1. Authentication (Clerk)                      │
│     • JWT Token Verification                    │
│     • Session Management                        │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│  2. Route Protection (Next.js Middleware)       │
│     • Public vs. Private Routes                 │
│     • Role-based Access                         │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│  3. Row Level Security (Supabase)               │
│     • BDRs see own data only                    │
│     • Managers see team data                    │
│     • Admins see all data                       │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│  4. API Security                                │
│     • Webhook Signature Verification            │
│     • Rate Limiting                             │
│     • Input Validation (Zod)                    │
└─────────────────────────────────────────────────┘
```

## Commission Calculation Flow

```
Deal Stage Changed to "Closed Won"
        │
        ▼
Database Trigger Fires
        │
        ├─────────────────────┐
        │                     │
        ▼                     ▼
Create First Month      Create Ongoing
Commission (50%)        Commission (10%)
        │                     │
        └─────────┬───────────┘
                  │
                  ▼
        Commission Records Created
                  │
                  ▼
        Real-time Update
                  │
                  ▼
        UI Shows New Commission
```

## Real-time Update Flow

```
Database Change (Deal Closed)
        │
        ▼
Supabase Real-time Engine
        │
        ▼
WebSocket Message Sent
        │
        ▼
Browser Receives Event
        │
        ▼
React Component Re-renders
        │
        ├─────────────────┬─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  Leaderboard       ActivityFeed      Dashboard
   Updates             Updates          Metrics
```

## Deployment Architecture (Netlify)

```
┌──────────────────────────────────────────────┐
│            Netlify Edge Network              │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │     Next.js Application            │     │
│  │  • Static Pages (SSG)              │     │
│  │  • Server Components (SSR)         │     │
│  │  • API Routes (Serverless)         │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │     Netlify Functions              │     │
│  │  • Background Jobs                 │     │
│  │  • Scheduled Tasks                 │     │
│  └────────────────────────────────────┘     │
│                                              │
└───────────────┬──────────────────────────────┘
                │
                ├──────────► Supabase (Database)
                │
                ├──────────► Clerk (Auth)
                │
                ├──────────► HubSpot (CRM)
                │
                └──────────► Slack (Notifications)
```

## Technology Stack Map

```
┌─────────────────────────────────────────────┐
│              Frontend                        │
│  • Next.js 15 (App Router)                  │
│  • React 18                                  │
│  • TypeScript                                │
│  • Tailwind CSS                              │
│  • shadcn/ui                                 │
│  • Recharts (Charts)                         │
│  • Lucide React (Icons)                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           State Management                   │
│  • Zustand (Global State)                   │
│  • TanStack Query (Server State)            │
│  • React Hook Form (Forms)                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              Backend                         │
│  • Supabase (Database)                      │
│  • Clerk (Authentication)                   │
│  • Next.js API Routes                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           Integrations                       │
│  • HubSpot API Client                       │
│  • Slack Webhooks                           │
│  • Resend (Email)                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            DevOps                            │
│  • Netlify (Hosting)                        │
│  • GitHub (Version Control)                 │
│  • Jest (Unit Tests)                        │
│  • Playwright (E2E Tests)                   │
└─────────────────────────────────────────────┘
```

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Lazy load components
2. **Image Optimization**: Next.js Image component
3. **Caching**: React Query with stale-while-revalidate
4. **Virtualization**: react-window for long lists
5. **Edge Functions**: Netlify Edge for faster response
6. **Database Indexes**: Optimized queries

### Monitoring Points
- Page load time (< 3s target)
- First Contentful Paint (< 1.5s)
- Time to Interactive (< 3.5s)
- API response time (< 500ms)
- Database query time (< 100ms)

---

This architecture is designed for:
✅ **Scalability** - Can grow to 100+ users
✅ **Performance** - Fast load times and real-time updates
✅ **Security** - Multiple layers of protection
✅ **Maintainability** - Clean separation of concerns
✅ **Cost-efficiency** - Optimized for ~$50-100/month
