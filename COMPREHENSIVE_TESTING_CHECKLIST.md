# Comprehensive Testing Checklist
## All Changes from Recent Sessions

**Date Created:** 2025-01-04
**Purpose:** Complete testing checklist for all features and fixes implemented
**Covers:** Activity tracking fixes, call history improvements, admin filtering, Claude proposal generator

---

## Test Session Overview

This checklist covers testing for:
1. **Lead Activity Tracking Fixes** (Migration 042, 043)
2. **Call History Display Improvements**
3. **Admin SDR Filtering**
4. **Claude Proposal Generator** (Planned feature)
5. **Deal Assignment Feature**
6. **Pipeline Appointment Indicators**
7. **Database Migrations**
8. **End-to-End Workflows**

**Total Tests:** 140+
**Estimated Testing Time:** 4-6 hours
**Recommended Testers:** 2-3 SDRs + 1 Admin

---

## Section 1: Lead Activity Tracking (Migration 042, 043)

### Test 1.1: Lead Activity Timeline Display
**Purpose:** Verify calls appear in lead activity timeline

**Prerequisites:**
- Have at least 1 lead in the system
- Have calling functionality working

**Steps:**
1. Navigate to leads list ([/dashboard/leads](../app/dashboard/leads))
2. Select any lead
3. Make a test call to the lead
4. End the call
5. Refresh the lead detail page

**Expected Results:**
- [ ] Call appears in Activity Timeline section
- [ ] Call has emoji indicator based on outcome:
  - [ ] ✅ for successful calls
  - [ ] 📵 for no answer
  - [ ] 📨 for voicemail
  - [ ] 📅 for callback scheduled
  - [ ] ❌ for not interested
  - [ ] ⭐ for qualified lead
  - [ ] 📞 for attempted call (no outcome)
- [ ] Call shows duration in minutes
- [ ] Call shows SDR name ("by John Smith")
- [ ] Call shows timestamp
- [ ] Activities are sorted newest first

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 1.2: Lead Status Auto-Update on Call
**Purpose:** Verify Migration 043 trigger updates lead status automatically

**Prerequisites:**
- Create a new lead with status "new"

**Steps:**
1. Create new lead with status "new"
2. Note the lead ID
3. Make a call to this lead
4. Complete the call (any outcome)
5. Check lead status in database OR refresh lead detail page

**Expected Results:**
- [ ] Lead status changes from "new" to "contacted"
- [ ] `last_contacted_at` field is populated with call timestamp
- [ ] Status change activity is created in `lead_activities` table
- [ ] If call again, status remains "contacted" (doesn't duplicate)
- [ ] Works for both successful and unsuccessful calls

**Database Check (Optional):**
```sql
SELECT id, status, last_contacted_at FROM leads WHERE id = '<lead_id>';
SELECT * FROM lead_activities WHERE lead_id = '<lead_id>' AND activity_type = 'status_change';
```

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 1.3: Activities from Both Tables
**Purpose:** Verify lead detail page queries both `lead_activities` and `activities` tables

**Prerequisites:**
- Lead with at least one call
- Access to database to manually insert test data

**Steps:**
1. Select a lead that has call history
2. Manually insert a note in `lead_activities` table (if possible)
3. Make a call (this should go to `activities` table via sync)
4. Refresh lead detail page

**Expected Results:**
- [ ] Activities from `lead_activities` table appear
- [ ] Activities from `activities` table appear
- [ ] Both sets of activities are combined and sorted by date
- [ ] No duplicate activities
- [ ] Timeline shows correct chronological order

**Code Reference:** [app/dashboard/leads/[id]/page.tsx:59-80](../app/dashboard/leads/[id]/page.tsx#L59-L80)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 2: Call History Display Improvements

### Test 2.1: Lead Name Display in Call History
**Purpose:** Verify call history shows lead names instead of just phone numbers

**Prerequisites:**
- Have calls to both leads and customers in system

**Steps:**
1. Navigate to [/dashboard/calls/history](../app/dashboard/calls/history)
2. Review the call list

**Expected Results:**
- [ ] Calls to customers show: "John Smith" (customer name)
- [ ] Calls to customers show company name if available
- [ ] Calls to leads show: "Jane Doe" with "Lead" badge
- [ ] Calls to leads show company name if available
- [ ] Calls with no lead/customer match show phone number
- [ ] Display priority: Customer > Lead > Phone Number

**Code Reference:** [app/dashboard/calls/history/page.tsx:123-148](../app/dashboard/calls/history/page.tsx#L123-L148)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 2.2: SDR Name Display
**Purpose:** Verify SDR name appears on each call

**Prerequisites:**
- Multiple SDRs have made calls

**Steps:**
1. Navigate to [/dashboard/calls/history](../app/dashboard/calls/history)
2. Review call list entries

**Expected Results:**
- [ ] Each call shows "by [SDR Name]" below customer/lead name
- [ ] SDR name is correct for each call
- [ ] Works for calls from different SDRs

**Code Reference:** [app/dashboard/calls/history/page.tsx:156-159](../app/dashboard/calls/history/page.tsx#L156-L159)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 2.3: Call Metadata Display
**Purpose:** Verify all call metadata displays correctly

**Prerequisites:**
- Calls with varying durations and directions

**Steps:**
1. Navigate to [/dashboard/calls/history](../app/dashboard/calls/history)
2. Review call entries for metadata

**Expected Results:**
- [ ] Call direction shows → for outbound, ← for inbound
- [ ] Duration shows as "2m 35s" format
- [ ] Timestamp shows in readable format
- [ ] Sentiment badge displays (positive/neutral/negative)
- [ ] Status badge displays (completed/in-progress/failed/no-answer)
- [ ] Transcription icon appears if call has transcription
- [ ] Recording icon appears if call has recording URL

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 3: Admin SDR Filtering

### Test 3.1: Admin Filter Dropdown Visibility
**Purpose:** Verify filter dropdown only shows for admins

**Prerequisites:**
- Admin account
- BDR account

**Steps - As Admin:**
1. Sign in as admin
2. Navigate to [/dashboard/calls/history](../app/dashboard/calls/history)
3. Look for "Filter by SDR" dropdown in top-right

**Expected Results:**
- [ ] "Filter by SDR" dropdown is visible
- [ ] Dropdown shows all SDRs and admins
- [ ] Dropdown shows role badges (admin/bdr)

**Steps - As BDR:**
1. Sign out
2. Sign in as BDR
3. Navigate to [/dashboard/calls/history](../app/dashboard/calls/history)

**Expected Results:**
- [ ] "Filter by SDR" dropdown does NOT appear
- [ ] BDR only sees their own calls

**Code Reference:** [app/dashboard/calls/history/page.tsx:112-114](../app/dashboard/calls/history/page.tsx#L112-L114)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 3.2: SDR Filter Functionality
**Purpose:** Verify filtering by SDR works correctly

**Prerequisites:**
- Admin account
- Multiple SDRs have made calls

**Steps:**
1. Sign in as admin
2. Navigate to [/dashboard/calls/history](../app/dashboard/calls/history)
3. Note total call count
4. Click "Filter by SDR" dropdown
5. Select an SDR
6. Observe call list updates

**Expected Results:**
- [ ] URL updates to `/dashboard/calls/history?sdr=<user_id>`
- [ ] Call count updates
- [ ] Only selected SDR's calls are shown
- [ ] SDR name shows in filter button
- [ ] X icon appears to clear filter

**Steps to Clear Filter:**
1. Click X icon on filter button OR select "All SDRs"

**Expected Results:**
- [ ] URL updates to `/dashboard/calls/history` (no query param)
- [ ] All calls shown again
- [ ] Call count matches original

**Code Reference:** [components/calls/sdr-filter-dropdown.tsx](../components/calls/sdr-filter-dropdown.tsx)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 4: Deal Assignment Feature

### Test 4.1: Assign Deal to SDR
**Purpose:** Verify admins can reassign deals

**Prerequisites:**
- Admin account
- At least 1 deal
- Multiple SDRs in system

**Steps:**
1. Navigate to pipeline ([/dashboard/pipeline](../app/dashboard/pipeline))
2. Click on any deal card
3. Click "Edit" button
4. Look for "Assign To" dropdown
5. Change assigned SDR
6. Save changes

**Expected Results:**
- [ ] "Assign To" dropdown shows all users (SDRs + admins)
- [ ] Dropdown shows role badges
- [ ] Can change assignment
- [ ] Changes save successfully
- [ ] Deal card updates to show new assignee
- [ ] Activity log records reassignment

**Code Reference:** [components/deals/deal-edit-modal.tsx:102-117](../components/deals/deal-edit-modal.tsx#L102-L117)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 5: Pipeline Appointment Indicators

### Test 5.1: Appointment Badge Display
**Purpose:** Verify deals with appointments show badge on pipeline

**Prerequisites:**
- Create deal with upcoming appointment

**Steps:**
1. Navigate to pipeline ([/dashboard/pipeline](../app/dashboard/pipeline))
2. Locate deal with appointment
3. Observe deal card

**Expected Results:**
- [ ] Blue badge appears on deal card
- [ ] Badge shows "Appointment: [Date]"
- [ ] Calendar icon appears
- [ ] Badge is blue (#3B82F6 or similar)
- [ ] Only upcoming appointments show (not past)
- [ ] Shows earliest appointment if multiple exist

**Code Reference:**
- [app/dashboard/pipeline/page.tsx:42-65](../app/dashboard/pipeline/page.tsx#L42-L65)
- [components/pipeline/deal-card.tsx:129-136](../components/pipeline/deal-card.tsx#L129-L136)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 6: Database Migrations

### Test 6.1: Migration 042 - Add lead_id to activities
**Purpose:** Verify migration 042 executed successfully

**Prerequisites:**
- Database access

**SQL Checks:**
```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activities' AND column_name = 'lead_id';

-- Check foreign key exists
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'activities' AND column_name = 'lead_id';

-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'activities' AND indexname = 'idx_activities_lead_id';

-- Check sync function includes lead_id
SELECT prosrc FROM pg_proc WHERE proname = 'sync_call_to_activities';
```

**Expected Results:**
- [ ] `lead_id` column exists in `activities` table
- [ ] Column type is UUID
- [ ] Foreign key to `leads(id)` exists
- [ ] ON DELETE SET NULL is set
- [ ] Index `idx_activities_lead_id` exists
- [ ] Sync function includes `NEW.lead_id` in INSERT

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 6.2: Migration 043 - Lead Status Auto-Update Trigger
**Purpose:** Verify migration 043 trigger is active

**Prerequisites:**
- Database access

**SQL Checks:**
```sql
-- Check trigger exists
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_lead_on_call';

-- Check function exists
SELECT prosrc FROM pg_proc WHERE proname = 'update_lead_on_call';

-- Test trigger manually
-- 1. Create test lead
INSERT INTO leads (first_name, last_name, email, phone, status)
VALUES ('Test', 'User', 'test@example.com', '+447700123456', 'new')
RETURNING id;

-- 2. Create call record (this should trigger status update)
INSERT INTO call_recordings (user_id, lead_id, to_number, direction, status)
VALUES ('<your_user_id>', '<test_lead_id>', '+447700123456', 'outbound', 'completed')
RETURNING id;

-- 3. Check lead status updated
SELECT id, status, last_contacted_at FROM leads WHERE id = '<test_lead_id>';
-- Should show status='contacted' and last_contacted_at populated

-- 4. Check activity created
SELECT * FROM lead_activities
WHERE lead_id = '<test_lead_id>' AND activity_type = 'status_change'
ORDER BY created_at DESC LIMIT 1;
```

**Expected Results:**
- [ ] Trigger `trigger_update_lead_on_call` exists on `call_recordings` table
- [ ] Trigger fires on INSERT and UPDATE
- [ ] Trigger condition: `NEW.lead_id IS NOT NULL`
- [ ] Function `update_lead_on_call` exists
- [ ] Manual test: Lead status updates from 'new' to 'contacted'
- [ ] Manual test: `last_contacted_at` is set
- [ ] Manual test: Status change activity is created

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 7: Claude Proposal Generator (PLANNED - Not Yet Implemented)

> **Note:** These tests will be performed after implementation of the Claude proposal generator feature.

### Test 7.1: Basic Proposal Generation
**Purpose:** Verify end-to-end proposal generation works

**Prerequisites:**
- Claude API key configured
- Supabase Storage set up
- Customer with website in system

**Steps:**
1. Navigate to customer detail page
2. Click "Generate AI Proposal" button
3. Observe progress dialog

**Expected Results:**
- [ ] Dialog opens with "Generating" status
- [ ] Progress bar shows 0-100%
- [ ] Progress updates every 2 seconds
- [ ] Stages appear in order:
  1. [ ] "Analyzing company website..." (0-25%)
  2. [ ] "Researching market intelligence..." (25-50%)
  3. [ ] "Analyzing competitors..." (50-70%)
  4. [ ] "Identifying high-value keywords..." (70-85%)
  5. [ ] "Generating proposal content..." (85-95%)
  6. [ ] "Creating PDF document..." (95-100%)
- [ ] Generation completes in 2-5 minutes
- [ ] "Proposal Ready!" message appears
- [ ] "View Proposal" and "Download PDF" buttons work
- [ ] PDF downloads successfully
- [ ] PDF opens in Adobe Reader/browser

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 7.2: Proposal Content Quality
**Purpose:** Verify generated proposal matches A1 Mobility template quality

**Prerequisites:**
- Successfully generated proposal from Test 7.1

**Steps:**
1. Open generated PDF
2. Review all 18 pages
3. Compare to A1 Mobility template

**Expected Results:**
- [ ] **Page 1 (Cover):** Company name, tagline, service area, investment range
- [ ] **Page 2 (Executive Summary):** Hook, brutal truth, market opportunity (£X.XM), current vs competitor traffic
- [ ] **Page 3 (Current vs Potential):** Table with 4 metrics, ROI calculation with 7 steps, 33x ROI example
- [ ] **Page 4 (Market):** 3 customer types, competitor table with 4 competitors, strengths/weaknesses
- [ ] **Page 5 (Opportunities):** 3 product categories with £X,XXX values, customer journey, seasonal table
- [ ] **Page 6 (How We'll Make You #1):** Analogy, 6-step process table
- [ ] **Page 7 (Keywords):** 5-10 keywords with search volume and revenue value, timeline (Month 1-3, 4-6, 7-12)
- [ ] **Page 8 (Content):** Content calendar table (6 types), emotional hook
- [ ] **Page 9 (Implementation):** 30 location pages, 8 product pages, trust metrics (100+ reviews, 24 videos, 50+ cases)
- [ ] **Page 10 (Packages):** 3-tier table (Local £2K, Regional £3K, National £5K) with ROI
- [ ] **Page 11 (12-Month Journey):** Month-by-month table with activities, results, revenue
- [ ] **Page 12 (Success Metrics):** 3 key numbers, 8 KPIs, ROI breakdown, compound effect statement
- [ ] **Page 13 (Why SEO Dons):** "We only work with winners" statement, track record table, 6 differentiators
- [ ] **Page 14 (What You Own):** List of permanent assets, fair warning statement
- [ ] **Page 15 (Next Steps):** 3 options comparison (Do nothing, Try yourself, Partner with us)
- [ ] **Page 16 (Getting Started):** Why timing matters, getting started table, FAQ (4-5 questions)
- [ ] **Page 17 (Final Push):** 3 key numbers, motivational close, clear call to action
- [ ] **Page 18 (Contact):** Strategy call details, 6 bullet points of what happens

**Content Quality Checks:**
- [ ] NO placeholder text ([INSERT], TODO, etc.)
- [ ] All numbers are real and specific (not "XX" or "N/A")
- [ ] Company name used throughout (not "Company X")
- [ ] Competitor names are real companies in same industry
- [ ] Keywords have real search volumes
- [ ] ROI calculations are mathematically correct
- [ ] Tone matches A1 template (direct, slightly aggressive, data-driven)
- [ ] Bold text is used for key statements
- [ ] Callout boxes have correct styling

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 7.3: PDF Design Quality
**Purpose:** Verify PDF matches A1 Mobility template design

**Prerequisites:**
- Generated PDF from Test 7.1

**Steps:**
1. Open PDF in Adobe Reader
2. Compare side-by-side with A1 Mobility template
3. Check design elements

**Expected Results:**
- [ ] **Colors:** Turquoise (#00D4D4) used throughout
- [ ] **Fonts:** Consistent font family (Inter or similar)
- [ ] **Page Layout:** Matches template spacing and margins
- [ ] **Tables:** Turquoise header row, proper borders, aligned columns
- [ ] **Callout Boxes:** Light cyan background (#CFFAFE), turquoise left border
- [ ] **Warning Boxes:** Yellow background (#FEF3C7), orange left border
- [ ] **Large Numbers:** 36px font, turquoise color, centered
- [ ] **Headings:**
  - [ ] H1 (36px, bold, dark gray)
  - [ ] H2 (24px, bold, turquoise)
  - [ ] H3 (18px, semibold, dark gray)
- [ ] **Body Text:** 10px, 1.6 line height, dark gray
- [ ] **Badges:** Rounded, colored backgrounds (cyan, yellow, green, etc.)
- [ ] **Page Numbers:** "Page X" and "seodons.co.uk" in footer
- [ ] **No rendering issues:** No overlapping text, broken tables, or cutoff content

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 7.4: Research Agent Quality
**Purpose:** Verify Claude research produces accurate, real data

**Prerequisites:**
- Database access to view research_data JSON

**Steps:**
1. Generate proposal for a real company
2. Access database to view `research_data` field
3. Validate research quality

**SQL Query:**
```sql
SELECT id, company_name, research_data FROM proposals WHERE id = '<proposal_id>';
```

**Expected Results:**

**Company Analysis:**
- [ ] Traffic estimate is realistic (not 0, not millions)
- [ ] Ranking keywords count matches industry norm
- [ ] Domain authority is 0-100 range
- [ ] Unique advantages are specific (not generic)
- [ ] Service categories match actual business
- [ ] Revenue estimate has proper range format

**Market Intelligence:**
- [ ] Market size has source/justification
- [ ] Growth rate is percentage with timeframe
- [ ] Demographics have specific percentages
- [ ] Seasonal patterns are relevant to industry

**Competitors:**
- [ ] 5-10 real competitors identified
- [ ] Competitor traffic data is realistic
- [ ] Strengths/weaknesses are specific
- [ ] "How to beat them" is actionable

**Keywords:**
- [ ] 50+ keywords identified
- [ ] Search volumes are real (from Semrush/Ahrefs or Claude research)
- [ ] Difficulty scores are 0-100 range
- [ ] Revenue calculations use reasonable conversion rates
- [ ] Mix of transactional, commercial, informational

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 7.5: Proposal Management
**Purpose:** Verify proposal management features work

**Steps:**
1. Navigate to proposals list ([/dashboard/proposals](../app/dashboard/proposals))
2. Locate generated proposal
3. Click to open proposal detail page

**Expected Results:**
- [ ] Proposal appears in list with:
  - [ ] Proposal number (P-2025-0001)
  - [ ] Company name
  - [ ] Status badge
  - [ ] Created date
  - [ ] Created by (SDR name)
- [ ] Detail page shows:
  - [ ] All proposal metadata
  - [ ] View/Download PDF buttons
  - [ ] Generation time
  - [ ] Token usage
  - [ ] Cost estimate
  - [ ] Research data (expandable)
- [ ] Can mark as "Sent"
- [ ] Can mark as "Accepted" or "Rejected"
- [ ] Activities tab shows generation history

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 7.6: Performance Under Load
**Purpose:** Verify system handles multiple concurrent generations

**Prerequisites:**
- 3 test customers with websites

**Steps:**
1. Open 3 browser tabs
2. Navigate to 3 different customer pages
3. Click "Generate AI Proposal" in all 3 tabs simultaneously
4. Observe progress in all tabs

**Expected Results:**
- [ ] All 3 generations start successfully
- [ ] Progress updates independently in each tab
- [ ] No rate limiting errors from Claude API
- [ ] All 3 complete within 10 minutes
- [ ] No database connection errors
- [ ] No memory issues
- [ ] PDFs generate correctly for all 3
- [ ] Each proposal has unique data (not duplicated)

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 7.7: Error Handling
**Purpose:** Verify proper error handling and recovery

**Test 7.7a: Invalid Company Data**

**Steps:**
1. Create customer with no website
2. Click "Generate AI Proposal"

**Expected Results:**
- [ ] Error message: "Website required for proposal generation"
- [ ] Generation does not start
- [ ] User can correct data and retry

**Test 7.7b: Claude API Failure**

**Steps:**
1. Temporarily invalidate Claude API key
2. Attempt to generate proposal

**Expected Results:**
- [ ] Error caught and displayed to user
- [ ] Proposal status set to "failed"
- [ ] Error details logged
- [ ] User can retry after fixing

**Test 7.7c: Mid-Generation Interruption**

**Steps:**
1. Start proposal generation
2. Close browser during research phase
3. Reopen browser and check proposal status

**Expected Results:**
- [ ] Proposal status is "generating" or "failed"
- [ ] No partial/corrupted PDF
- [ ] User can regenerate proposal
- [ ] No orphaned records in database

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 8: End-to-End Workflows

### Test 8.1: Complete SDR Workflow (Lead to Deal)
**Purpose:** Verify entire lead-to-customer-to-deal flow works

**Prerequisites:**
- BDR account
- Admin account (for verification)

**Steps:**
1. **Import Lead**
   - [ ] Navigate to [/dashboard/leads/import](../app/dashboard/leads/import)
   - [ ] Upload CSV with 1 test lead
   - [ ] Lead imports successfully

2. **Auto-Assignment**
   - [ ] Lead is assigned to an SDR
   - [ ] Assignment activity is created

3. **Make Call**
   - [ ] Navigate to lead detail page
   - [ ] Click "Call" button
   - [ ] Complete call with outcome "successful"

4. **Verify Auto-Updates**
   - [ ] Lead status updates to "contacted"
   - [ ] last_contacted_at is set
   - [ ] Call appears in activity timeline
   - [ ] Call shows in call history

5. **Convert to Customer**
   - [ ] Click "Convert to Customer" button
   - [ ] Fill in customer details
   - [ ] Confirm conversion

6. **Verify Conversion**
   - [ ] Customer record created
   - [ ] Lead marked as "converted"
   - [ ] Deal created (if applicable)

7. **Generate Proposal** (When feature is implemented)
   - [ ] Click "Generate AI Proposal" on customer page
   - [ ] Wait for generation
   - [ ] Proposal completes successfully

8. **Send Proposal**
   - [ ] Mark proposal as "sent"
   - [ ] Activity recorded

9. **Accept & Close Deal**
   - [ ] Mark proposal as "accepted"
   - [ ] Move deal to "Closed Won" stage
   - [ ] Commission calculated

**Expected Results:**
- [ ] Entire workflow completes without errors
- [ ] All statuses update correctly
- [ ] All activities are tracked
- [ ] Data consistency maintained

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 8.2: Admin Monitoring Workflow
**Purpose:** Verify admin can monitor all SDR activities

**Prerequisites:**
- Admin account
- Multiple SDRs with activity

**Steps:**
1. **View Leaderboard**
   - [ ] Navigate to [/dashboard/leaderboard](../app/dashboard/leaderboard)
   - [ ] Verify all SDRs appear (including admins if they have activity)

2. **Filter Call History**
   - [ ] Navigate to [/dashboard/calls/history](../app/dashboard/calls/history)
   - [ ] Filter by each SDR
   - [ ] Verify calls are correctly filtered

3. **Review Lead Activities**
   - [ ] Navigate to any lead detail page
   - [ ] Verify activity timeline is complete
   - [ ] Verify SDR names show on activities

4. **Check Deal Pipeline**
   - [ ] Navigate to [/dashboard/pipeline](../app/dashboard/pipeline)
   - [ ] Verify appointment indicators show
   - [ ] Verify can reassign deals

5. **Review Proposals** (When feature is implemented)
   - [ ] Navigate to proposals list
   - [ ] Verify can see all proposals
   - [ ] Filter by SDR

**Expected Results:**
- [ ] Admin has full visibility
- [ ] All filtering works correctly
- [ ] No permission errors
- [ ] Data is accurate and up-to-date

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 9: Regression Testing

### Test 9.1: Existing Features Still Work
**Purpose:** Ensure new changes didn't break existing functionality

**Quick Checks:**
- [ ] Dashboard loads and shows correct stats
- [ ] Leads list loads and displays correctly
- [ ] Customers list loads and displays correctly
- [ ] Deals list loads and displays correctly
- [ ] Pipeline drag-and-drop still works
- [ ] Appointments can be created
- [ ] Tasks can be created and completed
- [ ] SMS sending works
- [ ] Email sending works
- [ ] User management works
- [ ] Settings can be updated

**If any fail, document which feature broke:**

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Section 10: Performance Testing

### Test 10.1: Page Load Times
**Purpose:** Verify page performance is acceptable

**Steps:**
1. Clear browser cache
2. Load each page and measure time

**Expected Results (with ~1000 records in database):**
- [ ] Dashboard: < 2 seconds
- [ ] Leads list: < 3 seconds
- [ ] Lead detail: < 2 seconds
- [ ] Customers list: < 3 seconds
- [ ] Call history: < 3 seconds
- [ ] Pipeline: < 4 seconds
- [ ] Proposals list: < 3 seconds

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

### Test 10.2: Database Query Performance
**Purpose:** Verify database queries are optimized

**SQL Checks:**
```sql
-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'activities', 'lead_activities', 'call_recordings', 'proposals')
ORDER BY tablename, attname;

-- Check slow queries (if pg_stat_statements enabled)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%leads%' OR query LIKE '%activities%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Expected Results:**
- [ ] All foreign key columns have indexes
- [ ] No queries take > 1 second average
- [ ] Table sizes are reasonable
- [ ] No missing indexes identified

**Actual Results:**


**Pass/Fail:**
**Notes:**

---

## Test Summary

### Overall Results

**Total Tests:** 140+
**Tests Passed:** ___
**Tests Failed:** ___
**Tests Skipped:** ___ (with reason)

**Pass Rate:** ___%

### Critical Issues Found

1.
2.
3.

### Non-Critical Issues Found

1.
2.
3.

### Performance Notes


### Recommendations


### Sign-Off

**Tested By:** ___________________________
**Date:** ___________________________
**Approved By:** ___________________________
**Date:** ___________________________

---

## Appendix: Quick Test Commands

### Database Checks
```sql
-- Check Migration 042
SELECT column_name FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'lead_id';

-- Check Migration 043
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trigger_update_lead_on_call';

-- Check proposal tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'proposal%';

-- Count records
SELECT 'leads' as table, COUNT(*) as count FROM leads
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'lead_activities', COUNT(*) FROM lead_activities
UNION ALL
SELECT 'call_recordings', COUNT(*) FROM call_recordings
UNION ALL
SELECT 'proposals', COUNT(*) FROM proposals;
```

### Test Data Creation
```sql
-- Create test lead
INSERT INTO leads (first_name, last_name, email, phone, status, lead_source, lead_score)
VALUES ('Test', 'Lead', 'test@example.com', '+447700123456', 'new', 'import', 50)
RETURNING id;

-- Create test customer
INSERT INTO customers (first_name, last_name, email, phone, company, website)
VALUES ('Test', 'Customer', 'customer@example.com', '+447700654321', 'Test Corp', 'https://example.com')
RETURNING id;
```

### Cleanup Test Data
```sql
-- Delete test records (use with caution!)
DELETE FROM leads WHERE email LIKE 'test%@example.com';
DELETE FROM customers WHERE email LIKE 'test%@example.com';
DELETE FROM call_recordings WHERE to_number = '+447700123456';
DELETE FROM proposals WHERE company_name LIKE 'Test%';
```

---

**END OF CHECKLIST**
