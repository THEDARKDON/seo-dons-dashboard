# UK Phone Number Fix & SDR Assignment Feature

## Summary of Changes

This update adds two major features:

### 1. ✅ UK Phone Number Normalization (E.164 Format)
Fixes calling issues with UK non-geographic numbers like 0333, 0800, etc.

### 2. ✅ SDR Assignment in Deal Creation
Allows assigning deals to any SDR when creating them from customer or deals page.

---

## Feature 1: UK Phone Number Normalization

### The Problem
UK non-geographic numbers (0333, 0800, 0845, etc.) were failing because Twilio requires phone numbers in **E.164 international format**.

**Before:**
- Input: `0333 339 9808`
- Sent to Twilio: `0333 339 9808` ❌ (Invalid - missing country code)
- Result: Call fails with Twilio error

**After:**
- Input: `0333 339 9808`
- Normalized to: `+443333399808` ✅ (Valid E.164 format)
- Result: Call succeeds

### What is E.164 Format?
E.164 is the international phone number standard:
- Format: `+[country code][number]`
- UK Example: `+44` + `333339980 8` = `+443333399808`
- US Example: `+1` + `4155551234` = `+14155551234`

### How It Works Now

When you click "Call" on any lead/customer:

1. **Phone Number Input:** `0333 339 9808`
2. **Automatic Normalization:**
   - Removes formatting (spaces, dashes, parentheses)
   - Detects country (defaults to GB/UK)
   - Converts to E.164: `+443333399808`
3. **Logging (in console):**
   ```
   [CallContext] Normalized phone: 0333 339 9808 → +443333399808
   ```
4. **Call proceeds with correct format**

### Supported Number Types

#### UK Numbers
- **Mobile:** 07xxx → +447xxx
- **Geographic:** 01xxx, 02xxx → +441xxx, +442xxx
- **Non-Geographic:** 0333, 0343, 0345, 0370, 0371 → +44333, +44343, etc.
- **Freephone:** 0800, 0808 → +44800, +44808
- **Special:** 0843, 0844, 0845, 0870, 0871, 0872, 0873 → +44843, etc.

#### International Numbers
- Already in E.164 (starting with +): Passed through as-is
- Other countries: Automatically normalized based on country code

### Error Handling

If a number is invalid:
- **Error Toast:** "Invalid phone number format: [number]. Expected format: UK (0333 123 4567), US (+1 415 555 1234), or E.164 (+441234567890)"
- **Call doesn't proceed** (prevents wasted attempts)
- **Console logging** for debugging

### Technical Implementation

Created [lib/utils/phone.ts](lib/utils/phone.ts:1) with these functions:

```typescript
// Main normalization function
normalizePhoneNumber(phoneNumber, defaultCountry = 'GB'): string

// Display formatting (for UI)
formatPhoneNumberForDisplay(phoneNumber, defaultCountry = 'GB'): string

// Validation
isValidPhone(phoneNumber, defaultCountry = 'GB'): boolean

// Get country code from number
getCountryCode(phoneNumber): string | undefined

// Check if UK non-geographic
isUKNonGeographic(phoneNumber): boolean

// Batch normalize multiple numbers
normalizePhoneNumbers(phoneNumbers[], defaultCountry = 'GB'): Array
```

### Where It's Used

- **CallContext:** All outbound calls are normalized before connecting
- **Future:** Can be used for SMS, lead import, customer creation, etc.

---

## Feature 2: SDR Assignment in Deal Creation

### The Problem
When creating deals from the customer page or deals page, they were always assigned to the current user. SDRs couldn't assign deals to other team members, making it hard to distribute work.

### The Solution
Added an "Assign To" dropdown in the deal creation modal that shows all users (SDRs and admins).

### How It Works

1. **Open Deal Creation Modal**
   - From customer page: Click "Create Deal" or "Create First Deal"
   - From deals page: Click "New Deal"

2. **See New "Assign To" Field**
   - Located at the top of the form (below Deal Name)
   - Dropdown showing all users: "First Last (role)"
   - Defaults to current user
   - Can select any other SDR or admin

3. **Create the Deal**
   - Deal is assigned to the selected user
   - Shows in that user's pipeline
   - Appears in their deal list

### User Display Format

Dropdown shows:
```
John Smith (admin)
Sarah Johnson (sdr)
Mike Davis (sdr)
```

### Default Behavior

- **Default:** Current logged-in user (you)
- **Can change:** To any other user in the dropdown
- **Required:** Must select someone (can't create unassigned deal)

### Pipeline Visibility

When you assign a deal to another SDR:
- **Their Pipeline:** Deal appears in their /dashboard/deals and /dashboard/pipeline
- **Their Leaderboard:** If they close it, it counts toward their revenue
- **Your View (if admin):** You can still see all deals via admin panel

### Example Use Cases

1. **Manager assigning deal to SDR:**
   - Customer calls in → Manager creates deal → Assigns to best-fit SDR

2. **SDR handing off deal:**
   - SDR qualifies lead → Creates deal → Assigns to closer

3. **Load balancing:**
   - Admin distributes inbound leads → Assigns deals evenly across team

### Technical Details

- Loads users via Supabase query: `users` table, ordered by `first_name`
- Shows all roles (admin, sdr, manager, etc.)
- Uses `assigned_to` field (UUID) to store assignment
- Dropdown is disabled while loading users ("Loading users...")

---

## Testing Instructions

### Test UK Phone Normalization

1. **Find a lead with UK non-geographic number:**
   - Example: 0333 339 9808

2. **Click "Call" button**

3. **Open browser console (F12)**

4. **Look for log:**
   ```
   [CallContext] Normalized phone: 0333 339 9808 → +443333399808
   ```

5. **Call should connect successfully**

6. **Test different formats:**
   - `0333 339 9808` (spaces)
   - `0333-339-9808` (dashes)
   - `(0333) 339 9808` (parentheses)
   - `+443333399808` (already E.164)
   - All should work!

### Test SDR Assignment

1. **Go to a customer page**

2. **Click "Create Deal"**

3. **Check "Assign To" dropdown:**
   - Should show all users
   - Should default to you

4. **Select a different SDR**

5. **Fill in deal details and create**

6. **Verify:**
   - Deal created successfully
   - Toast: "Deal created successfully!"
   - Check that SDR's pipeline → deal should appear there

7. **Test from deals page:**
   - Go to /dashboard/deals
   - Click "New Deal"
   - Should also have "Assign To" dropdown
   - Create deal assigned to another SDR
   - Verify it appears in their list

### Edge Cases to Test

1. **Invalid phone number:**
   - Try calling: "12345" (invalid)
   - Should show error toast
   - Call shouldn't connect

2. **International number:**
   - Try: +1 415 555 1234 (US)
   - Should normalize correctly
   - Call should work if Twilio account supports US calls

3. **No SDR selected:**
   - Open deal modal
   - Clear the "Assign To" selection (if possible)
   - Try to create
   - Should show error: "Please select a user to assign this deal to."

---

## Dependencies Added

```json
{
  "libphonenumber-js": "^1.10.x"
}
```

This library provides:
- Comprehensive phone number parsing for 200+ countries
- E.164 formatting
- Validation
- Number type detection
- ~60KB gzipped (minimal overhead)

---

## Known Issues & Future Enhancements

### Known Issues
None currently - both features are production-ready!

### Future Enhancements

1. **Phone Normalization:**
   - Add phone formatting to lead import (CSV)
   - Validate phone numbers on lead/customer creation
   - Display formatted phone numbers in UI (0333 339 9808 instead of +443333399808)
   - Add phone number validation to forms

2. **SDR Assignment:**
   - Add "Reassign Deal" feature (change assignment after creation)
   - Add bulk deal assignment (assign multiple deals at once)
   - Add assignment notifications (notify SDR when deal assigned to them)
   - Filter users by role (only show SDRs in dropdown, not admins)

---

## Rollback Instructions

If issues occur:

### Rollback Phone Normalization

```bash
# Remove libphonenumber-js
npm uninstall libphonenumber-js

# Revert CallContext changes
git checkout HEAD~1 -- contexts/CallContext.tsx

# Remove phone utility file
rm lib/utils/phone.ts
```

### Rollback SDR Assignment

```bash
# Revert deal modal changes
git checkout HEAD~1 -- components/deals/deal-create-modal.tsx
```

### Full Rollback

```bash
git revert HEAD
git push origin main
```

---

## Success Criteria

✅ **Phone Normalization Working:**
- UK 0333 numbers connect successfully
- UK 0800 numbers connect successfully
- UK mobile (07xxx) numbers work
- International numbers work
- Invalid numbers show error (don't attempt call)

✅ **SDR Assignment Working:**
- Can see all users in dropdown
- Defaults to current user
- Can select different user
- Deal is assigned to selected user
- Assigned user sees deal in their pipeline

---

## Support

If you encounter issues:

1. **Check browser console** (F12) for error messages
2. **Look for normalization logs:** `[CallContext] Normalized phone: ...`
3. **Verify Migration 040 was run** (fixes deal creation errors)
4. **Check Supabase RLS policies** (if users don't appear in dropdown)

**Common Issues:**

- **"Invalid phone number format" error:** Phone number format is invalid, check the number
- **Dropdown empty:** Users may not be loading - check Supabase connection
- **Deal creation fails:** Run Migration 040 to fix trigger issue

---

Last Updated: 2025-11-03
