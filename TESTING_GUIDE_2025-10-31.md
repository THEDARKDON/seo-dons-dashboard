# Testing Guide - Fixes Made October 31, 2025

## STEP 1: Run SQL First (REQUIRED)

**Before testing anything**, go to Supabase and run this:

**URL:** https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new

```sql
ALTER TABLE lead_imports
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE lead_imports
ALTER COLUMN file_name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_imports_assigned_to ON lead_imports(assigned_to);
```

---

## STEP 2: Wait for Deployment

Check Vercel shows latest commit `35486c8` is deployed.

---

## What Was Fixed Today

### ✅ 1. Google Calendar Connection Error
**File Changed:** `lib/calendar/google-calendar.ts:293`

**Test:**
1. Go to `/dashboard/calendar`
2. Should load without PGRST116 error
3. Click "Connect Google Calendar"
4. Complete OAuth - should work without errors

---

### ✅ 2. Admin Dashboard - SDR Leads Showing 0
**File Changed:** `app/dashboard/admin/page.tsx:19-20`

**Test:**
1. Login as admin
2. Go to `/dashboard/admin`
3. Look at SDR Performance table
4. **Expected:** Jamie should show actual lead count (not 0)

**Verify with SQL:**
```sql
SELECT
  u.first_name,
  COUNT(l.id) as leads
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id
WHERE u.role IN ('bdr', 'manager')
GROUP BY u.id, u.first_name;
```

---

### ✅ 3. Lead Import from CSV
**Files Changed:** `app/api/admin/leads/import/route.ts:41` + SQL above

**Test:**
1. Go to `/dashboard/admin/users`
2. Click any SDR → "Manage Leads"
3. Click "Import Leads"
4. Upload CSV:
```csv
first_name,last_name,email,company
John,Doe,john@test.com,Acme
Jane,Smith,jane@test.com,TechCo
```
5. Click Import

**Expected:** Success message, no 500 error

---

### ✅ 4. LinkedIn Post Templates
**Files Changed:** Multiple social/* files

**Test:**
1. Go to `/dashboard/social`
2. Should see 12 post templates
3. Click any template
4. Goes to `/dashboard/social/new` with content pre-filled
5. Dropdown should show all 12 templates

**12 Templates:**
- Thought Leadership
- Company Milestone
- Industry News Share
- Client Success Story
- Team Highlight
- Service Showcase
- Weekly Tips
- Question to Audience
- Behind the Scenes
- Personal Story
- Event Announcement
- Gratitude Post

---

## Quick Test Checklist

Run these after SQL + deployment:

- [ ] **Calendar** - Loads without error, can connect
- [ ] **Admin Dashboard** - SDR leads show correct count
- [ ] **Lead Import** - Upload CSV successfully
- [ ] **Templates** - See 12 templates on social page

---

## Known Issues (Not Fixed Yet)

### Phone Number Display
- User management shows "Not assigned" even when assigned
- Phone numbers tab display issue
- **Workaround:** Check dropdown, assignment still works

### To Be Done Next Session
- LinkedIn profile URL field
- Make LinkedIn tasks mandatory
- Dashboard layout improvements

---

## Rollback if Needed

```bash
# Calendar or admin dashboard issue
git revert 35486c8
git push

# Template issue
git revert 2933c63
git push

# Lead import code issue (SQL will remain)
git revert 564768a 838440e
git push
```

---

## Commits Made Today

1. `35486c8` - Google Calendar + Admin caching
2. `838440e` - file_name constraint fix
3. `564768a` - Lead import column fixes
4. `2933c63` - LinkedIn templates

---

**Date:** 2025-10-31
**Status:** Ready to test after SQL + deployment
