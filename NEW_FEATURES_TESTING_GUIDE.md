# Testing Guide for New Features - November 2025

This guide covers step-by-step testing for all features implemented in the latest release.

---

## Prerequisites

### 1. Run Database Migration 039
Before testing secondary phone features, you MUST run the migration:

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL:

```sql
-- Add secondary phone field to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS phone_secondary TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_phone_secondary ON leads(phone_secondary);

-- Add comment
COMMENT ON COLUMN leads.phone_secondary IS 'Secondary/alternate phone number for the lead';
```

5. Click **Run** (or press Ctrl/Cmd + Enter)

**Option B: Via Supabase CLI**
```bash
npx supabase db push
```

**Verify Migration:**
```sql
-- Should return: column_name = 'phone_secondary', data_type = 'text'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'phone_secondary';
```

### 2. Ensure You Have Test Data
- At least 2 leads in the database
- At least 1 customer in the database
- Admin role assigned to your test user

---

## Feature 1: Bulk Lead Assignment (Fixed)

**What Was Fixed:** Admin endpoint `/api/admin/users` was missing, breaking bulk lead assignment

### Test Steps

1. **Sign in as Admin User**
   - Go to https://www.seodonscrm.co.uk/sign-in
   - Sign in with admin credentials

2. **Navigate to Leads Page**
   - Click **Leads** in sidebar
   - Leads list should load successfully

3. **Select Multiple Leads**
   - Check the checkboxes for at least 2-3 leads
   - You should see "X selected" text at the top

4. **Open Bulk Actions Menu**
   - Click the **Bulk Actions** dropdown
   - Should see options: Assign, Change Category, Delete

5. **Test Bulk Assign**
   - Click **Assign**
   - A modal should appear with a dropdown of SDRs
   - Select an SDR from the list
   - Click **Assign Leads**
   - Should see success toast: "Successfully assigned X leads"
   - Check the leads - their `assigned_to` should now show the selected SDR

### Expected Results
- ✅ Dropdown shows list of users (first_name + last_name)
- ✅ Assignment succeeds without 404 errors
- ✅ Leads are assigned to the selected SDR
- ✅ No console errors

### Known Issues to Check
- ❌ If you see "Failed to load users" - check Supabase logs
- ❌ If you see 403 error - verify admin role in users table

---

## Feature 2: Persistent Call Widget (NEW)

**What Was Built:** Calls no longer end when navigating between pages. Floating widget persists across the entire app.

### Test Steps

1. **Navigate to Any Lead/Customer Page**
   - Go to **Leads** → Click any lead with a phone number
   - OR go to **Customers** → Click any customer with a phone number

2. **Initiate a Call**
   - Click the **Call** button next to the phone number
   - Should see the floating call widget appear in the bottom-right corner
   - Widget should show: "Connecting..."

3. **Wait for Call to Connect**
   - After a few seconds, status should change to "Ringing..."
   - When answered, status should change to "00:00" (timer starts)

4. **Navigate Away from the Page**
   - While call is active, click **Dashboard** in the sidebar
   - OR click **Leads** to go to leads list
   - OR type a URL directly in the address bar

5. **Verify Call Persists**
   - The floating call widget should STILL be visible
   - Call timer should continue counting up
   - You should still hear audio
   - Call should NOT disconnect

6. **Test Minimize/Maximize**
   - Click the minimize button (down arrow icon) on the widget
   - Widget should shrink to a small badge showing customer name + call duration
   - Click the minimized badge
   - Widget should expand back to full interface

7. **Navigate to Multiple Pages**
   - While call is active, visit:
     - Dashboard
     - Deals
     - Customers
     - Any other page
   - Widget should follow you everywhere

8. **End the Call**
   - Click the red **End Call** button (phone with X icon)
   - Widget should disappear
   - Call should disconnect

### Expected Results
- ✅ Call persists when navigating between pages
- ✅ Audio continues playing during navigation
- ✅ Widget follows you to every page
- ✅ Minimize/maximize works correctly
- ✅ Timer continues counting during navigation
- ✅ Only ends when you click the red button or lead hangs up

### Edge Cases to Test
- Start call → Navigate 5+ pages → End call (should work)
- Start call → Minimize widget → Navigate → Maximize (should work)
- Try to start a second call while one is active (should show error: "A call is already in progress")

### Known Issues to Check
- ❌ If call ends on navigation - check browser console for errors
- ❌ If widget disappears - check that FloatingCallWidget is in app/layout.tsx
- ❌ If audio cuts out - check Twilio Device connection

---

## Feature 3: DTMF Keypad (NEW)

**What Was Built:** Keypad to navigate automated phone systems (IVR menus like "Press 1 for sales, Press 2 for support")

### Test Steps

1. **Start a Call to a Corporate Number**
   - Find a lead with a corporate phone number (one that has an IVR menu)
   - Examples:
     - 0333 339 9808 (if you have this in your leads)
     - Any large company's main number
   - Click **Call** button

2. **Wait for Call to Connect**
   - Wait for the call to reach "Connected" status
   - You should hear the IVR greeting (e.g., "Press 1 for...")

3. **Open the Keypad**
   - In the floating call widget, click the **#** button
   - A 12-button keypad should appear below the call controls
   - Buttons: 1, 2, 3, 4, 5, 6, 7, 8, 9, *, 0, #

4. **Press DTMF Digits**
   - Click button "1"
   - Should hear a beep/tone (DTMF tone)
   - IVR should respond to the digit
   - Try pressing multiple digits (e.g., "1" then "2")
   - Each should send a tone

5. **Test All Special Characters**
   - Press **\*** (star)
   - Press **#** (pound/hash)
   - Both should send tones

6. **Hide the Keypad**
   - Click the **#** button again (in call controls)
   - Keypad should disappear

### Expected Results
- ✅ Keypad only appears when call is "connected"
- ✅ Each button press sends an audible DTMF tone
- ✅ IVR system responds to the digits
- ✅ Can toggle keypad on/off
- ✅ All 12 buttons work (0-9, *, #)

### Edge Cases to Test
- Try to open keypad when call is "ringing" (should be disabled)
- Press multiple digits rapidly (should send all tones)
- Navigate to another page with keypad open (keypad should persist)

### Known Issues to Check
- ❌ If tones don't play - check Twilio Device is connected
- ❌ If IVR doesn't respond - digits may not be sending (check console)
- ❌ If keypad doesn't appear - check call status is "connected"

---

## Feature 4: Unified Messages API (NEW)

**What Was Built:** Combined API endpoint that returns SMS, Email, and Internal messages in a single sorted list

### Test Steps

1. **Check Existing Message Threads**
   - Go to **Messages** in the sidebar
   - Click on a conversation that has SMS messages
   - OR go to a lead/customer page that has communications

2. **Verify Messages Display**
   - Check if SMS messages are now visible in the thread
   - Check if Email messages are visible
   - Messages should be sorted by timestamp (oldest to newest)
   - Each message should have a type indicator (SMS, Email, Internal)

3. **Test Read Status**
   - Find an unread SMS in notifications
   - Click on the conversation
   - Message should be marked as read
   - Notification badge should decrease

4. **Test API Directly (Optional)**
   - Open browser DevTools → Network tab
   - Go to a message thread
   - Find the API call to `/api/messages/unified`
   - Check response:
     ```json
     {
       "messages": [
         {
           "id": "...",
           "content": "...",
           "message_type": "sms" | "email" | "internal",
           "created_at": "...",
           "direction": "inbound" | "outbound"
         }
       ],
       "hasMore": false,
       "totalCount": 5
     }
     ```

### Expected Results
- ✅ SMS messages appear in chat threads (not just notifications)
- ✅ Email messages appear in chat threads
- ✅ Messages are sorted by timestamp
- ✅ Unread messages are marked as read when viewed
- ✅ All message types have correct type indicators

### Known Issues to Check
- ❌ If SMS messages still don't show - check if frontend is calling `/api/messages/unified`
- ❌ If messages are out of order - check timestamp sorting in API
- ❌ If read status doesn't update - check Supabase RLS policies

**NOTE:** The frontend components may still need to be updated to call the new unified endpoint. If messages don't appear, this is the next step.

---

## Feature 5: Secondary Phone Field (NEW)

**What Was Built:** Leads can now have two phone numbers (primary + secondary)

### Test Steps

1. **Add Secondary Phone to Existing Lead**
   - Go to **Leads** → Click any lead
   - Click **Edit** button (pencil icon)
   - Scroll to find "Secondary Phone" field
   - Enter a second phone number (e.g., +44 7123 456789)
   - Click **Save**

2. **Verify Display**
   - Lead detail page should show both phone numbers:
     ```
     Phone: +44 7700 123456    [Call button]
     Alt: +44 7123 456789       [Call button]
     ```
   - Both numbers should be clickable (tel: links)
   - Both should have separate Call buttons

3. **Test Calling Secondary Number**
   - Click **Call** button next to the secondary number
   - Call should initiate to the secondary number
   - Widget should show the correct phone number being called

4. **Test Import with Secondary Phone**
   - Go to **Leads** → **Import**
   - Upload a CSV with these columns:
     ```csv
     first_name,last_name,email,phone,phone_secondary
     John,Doe,john@example.com,+447700123456,+447700987654
     ```
   - Import should succeed
   - Check the imported lead - should have both numbers

5. **Test Creating New Lead with Secondary**
   - Go to **Leads** → **New Lead**
   - Fill in all required fields
   - Fill in "Secondary Phone" field
   - Submit
   - Check lead detail - both numbers should appear

### Expected Results
- ✅ Secondary phone field appears in lead edit modal
- ✅ Both phone numbers display on lead detail page
- ✅ Both numbers are clickable
- ✅ Both have separate call buttons
- ✅ Can call either number independently
- ✅ Import works with phone_secondary column

### Edge Cases to Test
- Lead with only primary phone (secondary empty) - should display normally
- Lead with only secondary phone (primary empty) - should display secondary
- Lead with neither phone number - no phone section should appear
- Very long phone numbers (20+ digits) - should not break layout

### Known Issues to Check
- ❌ If secondary phone doesn't save - check Migration 039 was run
- ❌ If import fails - check CSV has correct column name: `phone_secondary`
- ❌ If call button doesn't work - check ClickToCallButton props

---

## Feature 6: Create Deal from Customer Page (NEW)

**What Was Built:** Can now create deals directly from customer details page, with customer info pre-filled

### Test Steps

1. **Navigate to Customer with Existing Deals**
   - Go to **Customers** → Click any customer that already has deals
   - Scroll to the "Deals" section
   - Should see a "Create Deal" button in the header

2. **Create Deal from Header Button**
   - Click **Create Deal** button in the header
   - Modal should open with "Create New Deal" title
   - Customer name should be pre-filled/selected
   - Fill in:
     - Deal Name: "Test Deal from Customer Page"
     - Deal Value: 5000
     - Stage: "Proposal"
     - Probability: 75
   - Click **Create Deal**
   - Should see success toast
   - Deal should appear in the customer's deals list

3. **Navigate to Customer with NO Deals**
   - Go to **Customers** → Click a customer with 0 deals
   - Should see empty state message: "No deals found"
   - Should see "Create First Deal" button

4. **Create First Deal**
   - Click **Create First Deal** button
   - Modal should open
   - Customer should be pre-linked
   - Fill in deal details
   - Click **Create Deal**
   - Empty state should disappear
   - New deal should appear in the list

5. **Verify Deal is Linked**
   - Click on the newly created deal
   - Deal detail page should load
   - Customer info section should show the correct customer
   - Clicking customer name should navigate back to customer page

### Expected Results
- ✅ "Create Deal" button appears in customer deals section
- ✅ Modal opens with customer pre-selected
- ✅ Deal creation succeeds
- ✅ Deal appears in customer's deals list immediately
- ✅ Deal is properly linked to customer (customer_id set)
- ✅ Can create multiple deals for same customer

### Edge Cases to Test
- Customer with 0 deals → Create first deal → Should see deals list (not empty state)
- Customer with 5 deals → Create another → Should appear at top/bottom of list
- Create deal → Cancel modal → Modal closes without creating deal
- Create deal → Navigate away mid-creation → No partial deal created

### Known Issues to Check
- ❌ If customer is not pre-filled - check DealCreateModal customerId prop
- ❌ If deal doesn't appear in list - page may need refresh (check if onSuccess callback is working)
- ❌ If modal doesn't open - check DealCreateModal import

---

## Feature 7: Post-Call Actions (NEW)

**What Was Built:** After call ends, widget prompts for follow-up actions (book appointment)

### Test Steps

1. **Make a Test Call**
   - Find a lead with both phone number AND email address
   - Click **Call** button
   - Wait for call to connect
   - Have a brief conversation (or wait a few seconds)

2. **End the Call**
   - Click the red **End Call** button
   - Widget should change to show "Call Ended" status
   - Widget should NOT disappear immediately

3. **Check for Post-Call Actions**
   - Widget should display:
     - Message: "Would you like to schedule a follow-up?"
     - Button: "Book Appointment" (with calendar icon)
     - Button: "Close"

4. **Test Book Appointment**
   - Click **Book Appointment** button
   - Calendar booking modal should open
   - Customer email should be pre-filled
   - Customer name should be pre-filled
   - Select a date/time
   - Enter meeting details
   - Click **Book**
   - Should create calendar event
   - Should see success toast

5. **Test Close Button**
   - End another call
   - Click **Close** button in post-call actions
   - Widget should disappear completely
   - Call state should reset to "idle"

6. **Test with Lead Without Email**
   - Find a lead with phone but NO email
   - Make a call
   - End the call
   - Post-call actions should NOT appear (no email = can't book meeting)
   - Widget should disappear after a few seconds

### Expected Results
- ✅ Post-call actions appear after call ends
- ✅ Only appear if customer has email address
- ✅ Book Appointment button opens calendar modal
- ✅ Customer info is pre-filled in calendar modal
- ✅ Close button dismisses the widget
- ✅ Widget doesn't block other UI elements

### Edge Cases to Test
- End call → Book appointment → Cancel modal → Close widget (should work)
- End call → Navigate away → Widget should persist → Book appointment (should work)
- Multiple calls in a row → Post-call actions should appear each time
- Call lead without email → No post-call actions (expected behavior)

### Known Issues to Check
- ❌ If post-call actions don't appear - check callState.customerEmail is set
- ❌ If calendar modal doesn't open - check CalendarBookingModal import
- ❌ If customer info isn't pre-filled - check props being passed

---

## Feature 8: Admin Import Fixed (CRITICAL)

**What Was Fixed:** Removed Instantly.ai integration fields that were causing all 159 admin imports to fail with PGRST204 errors

### Test Steps

1. **Prepare Test CSV**
   - Create a CSV file: `test_import.csv`
   - Add these columns (minimum):
     ```csv
     first_name,last_name,email,phone,company,status
     Test,User,test1@example.com,+447700123456,Test Company,new
     Test2,User2,test2@example.com,+447700987654,Test Company 2,contacted
     ```

2. **Navigate to Admin Import**
   - Sign in as Admin
   - Go to **Admin** → **Leads** (or use the leads import page)
   - Should see "Import Leads" interface

3. **Upload CSV**
   - Click **Choose File** or drag-and-drop your CSV
   - Select your test CSV file
   - CSV preview should appear

4. **Map Columns**
   - Map CSV columns to database fields:
     - first_name → First Name
     - last_name → Last Name
     - email → Email
     - phone → Phone
     - company → Company
     - status → Status
   - Click **Import**

5. **Check Import Results**
   - Should see success message: "Successfully imported 2 leads"
   - Should NOT see any PGRST204 errors
   - Should NOT see errors about "instantly_campaign_id" or "instantly_lead_id"

6. **Verify Leads Were Created**
   - Go to **Leads** page
   - Search for "test1@example.com"
   - Lead should appear with all correct data
   - Check second lead too

7. **Test Large Import (Optional)**
   - Create CSV with 50+ leads
   - Import should succeed without errors
   - All leads should be created

### Expected Results
- ✅ Import completes successfully
- ✅ No PGRST204 errors
- ✅ No errors about Instantly.ai fields
- ✅ All leads are created in database
- ✅ All field mappings work correctly

### What Was Broken Before
- ❌ All imports failed with: "Could not find the 'instantly_campaign_id' column"
- ❌ 159 leads failed to import
- ❌ Admin import was completely unusable

### Known Issues to Check
- ❌ If you still see Instantly.ai errors - check git is up to date
- ❌ If import fails - check Supabase service role key is set
- ❌ If only some leads import - check CSV data quality

---

## Regression Testing

Test these existing features to ensure nothing broke:

### 1. Regular Click-to-Call
- Go to a lead page
- Click **Call** button
- Should still work with new floating widget
- ✅ Call connects
- ✅ Widget appears

### 2. Lead Edit Modal
- Edit a lead
- Change name, email, company
- Save
- ✅ Changes persist
- ✅ No errors

### 3. Deal Creation (from Deals page)
- Go to **Deals** → **New Deal**
- Create a deal WITHOUT selecting a customer
- ✅ Should still work
- ✅ Customer field should be optional

### 4. Bulk Lead Delete
- Select multiple leads
- Click **Bulk Actions** → **Delete**
- Confirm deletion
- ✅ Leads should be deleted
- ✅ No 404 errors

### 5. Leaderboard
- Go to **Leaderboard**
- ✅ Should load without errors
- ✅ Real-time updates still work

### 6. Call History
- Go to **Calls** → **History**
- ✅ Call records display
- ✅ Can view call details

---

## Performance Testing

### Page Load Times
Test these pages and ensure they load quickly:

| Page | Expected Load Time | How to Test |
|------|-------------------|-------------|
| Leads List | < 2s | Go to /dashboard/leads, check Network tab |
| Lead Detail | < 1.5s | Click any lead, check load time |
| Customer Detail | < 2s | Click any customer, check load time |
| Dashboard | < 2s | Navigate to /dashboard |

**How to Measure:**
1. Open Chrome DevTools → Network tab
2. Enable "Disable cache"
3. Reload page
4. Check "Load" time at bottom of Network tab

### Call Widget Performance
- Start a call
- Navigate between 10+ pages rapidly
- ✅ Widget should follow smoothly
- ✅ No lag or stuttering
- ✅ Audio should not cut out

---

## Browser Compatibility

Test in these browsers:

### Desktop
- [ ] Chrome (latest) - Primary target
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] Safari iOS (iPhone)
- [ ] Chrome Android

**What to Check:**
- Floating call widget displays correctly
- DTMF keypad buttons are tappable on mobile
- Modal forms work on small screens
- No layout breaking

---

## Known Issues & Limitations

### Issue 1: UK Non-Geographic Numbers (0333, 0800, etc.)
**Status:** IDENTIFIED BUT NOT FIXED

**Symptoms:**
- Calls to 0333 numbers may fail
- Twilio error: "Invalid phone number"

**Root Cause:**
- UK numbers need E.164 formatting: +44333... instead of 0333...

**Workaround:**
- Manually format numbers to E.164 before calling
- Add +44 prefix and remove leading 0

**Planned Fix:**
- Implement automatic phone number normalization
- Add E.164 formatting library (libphonenumber-js)

### Issue 2: Gmail Scope Error for Auto-Send
**Status:** USER ACTION REQUIRED

**Symptoms:**
- Auto-send emails fail after calls
- Error: "insufficient authentication scopes"

**Root Cause:**
- SDR didn't grant "Send email on your behalf" permission during Gmail OAuth

**Fix:**
1. Go to **Settings** → **Email**
2. Click **Disconnect Gmail**
3. Click **Connect Gmail**
4. When prompted, check ALL permission boxes:
   - ✅ Read emails
   - ✅ Send emails on your behalf ← THIS ONE!
   - ✅ Manage drafts
5. Complete connection

### Issue 3: Unified Messages Frontend Not Integrated
**Status:** API READY, FRONTEND PENDING

**Details:**
- The `/api/messages/unified` endpoint is built and working
- Frontend components (MessageFeed, ChatInterface) may still call old endpoints
- Need to update frontend to call unified endpoint

**Next Steps:**
- Update MessageFeed component to call `/api/messages/unified?conversationId=X&type=all`
- Update UI to show message type badges (SMS, Email, Internal)

---

## Testing Checklist

Use this checklist to track your testing progress:

### Critical Features (Must Test)
- [ ] Bulk lead assignment works
- [ ] Admin import succeeds (no PGRST204 errors)
- [ ] Calls persist across navigation
- [ ] DTMF keypad works in live calls
- [ ] Secondary phone field displays and works
- [ ] Can create deal from customer page
- [ ] Post-call actions appear

### Important Features
- [ ] Unified messages API works (if frontend updated)
- [ ] Call widget minimizes/maximizes
- [ ] Both phone numbers are callable
- [ ] Calendar booking from post-call works

### Regression Testing
- [ ] Regular click-to-call still works
- [ ] Lead edit/create works
- [ ] Deal create (from deals page) works
- [ ] Bulk delete works
- [ ] Call history displays

### Performance
- [ ] Pages load in < 2s
- [ ] Widget follows navigation smoothly
- [ ] No memory leaks during long calls

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on mobile

---

## Rollback Plan

If critical issues are found:

### Immediate Rollback (Git)
```bash
# Find the last working commit
git log --oneline

# Revert to last working state (replace COMMIT_HASH)
git revert HEAD
# OR
git reset --hard <COMMIT_HASH>

# Force push (CAREFUL!)
git push --force
```

### Rollback Database Migration 039
```sql
-- Remove secondary phone field
ALTER TABLE leads DROP COLUMN IF EXISTS phone_secondary;
DROP INDEX IF EXISTS idx_leads_phone_secondary;
```

### Rollback Specific Files
If only one feature is broken:

```bash
# Revert just the admin import fix
git checkout HEAD~1 -- app/api/admin/leads/import/route.ts

# Revert just the call context
git checkout HEAD~1 -- contexts/CallContext.tsx
git checkout HEAD~1 -- components/calling/floating-call-widget.tsx
```

---

## Success Criteria

All features are considered successfully tested when:

1. ✅ **Admin Import**: Can import 50+ leads without errors
2. ✅ **Persistent Calls**: Can navigate 10+ pages without call dropping
3. ✅ **DTMF Keypad**: Can successfully navigate a corporate IVR menu
4. ✅ **Secondary Phone**: Can call both phone numbers for the same lead
5. ✅ **Deal Creation**: Can create deals from customer page with customer pre-linked
6. ✅ **Post-Call Actions**: Calendar modal opens with correct customer data
7. ✅ **No Regressions**: All existing features still work
8. ✅ **Performance**: All pages load in < 2s
9. ✅ **Cross-Browser**: Works in Chrome, Firefox, Safari

---

## Reporting Issues

If you find a bug, report it with this information:

**Bug Report Template:**

```markdown
## Bug Title
Brief description

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots:**
[Attach if helpful]

**Environment:**
- Browser: Chrome 120
- Device: MacBook Pro M1
- User Role: Admin
- URL: /dashboard/leads

**Console Errors:**
```
[Paste console errors here]
```

**Priority:** High / Medium / Low
```

---

## Next Steps After Testing

Once all tests pass:

1. **Document any workarounds** for known issues
2. **Update user training materials** with new features
3. **Monitor production** for the first 24-48 hours
4. **Gather user feedback** from SDRs using the features
5. **Plan next iteration** based on feedback

---

Last Updated: 2025-11-03
Version: 1.0 - Initial Release
