# URGENT: Run Migration 040 Immediately

## Critical Issue
**ALL deal creations are currently failing** in production with error:
```
Error: record "new" has no field "lead_id" (code: 42703)
```

## Root Cause
Migration 030 created a trigger `auto_create_customer_from_deal()` that tries to access fields that don't exist in the `deals` table:
- `contact_name`
- `contact_email`
- `contact_phone`
- `lead_id`

This trigger fires on EVERY deal INSERT, causing 100% failure rate.

## Immediate Fix Required

### Step 1: Run Migration 040 in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL:

```sql
-- Drop the problematic trigger and function completely
DROP TRIGGER IF EXISTS trigger_auto_create_customer_from_deal ON deals;
DROP FUNCTION IF EXISTS auto_create_customer_from_deal();

-- Add comment explaining why we removed it
COMMENT ON TABLE deals IS 'Deals table - trigger for auto-creating customers was removed in Migration 040 due to referencing non-existent fields';
```

5. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 2: Verify It Worked

Run this query to confirm the trigger is gone:

```sql
-- Should return 0 rows
SELECT tgname
FROM pg_trigger
WHERE tgname = 'trigger_auto_create_customer_from_deal';
```

### Step 3: Test Deal Creation

1. Go to a customer page
2. Click "Create Deal"
3. Fill in deal details
4. Click "Create Deal"
5. Should succeed with no errors!

## What Was Removed

The trigger was attempting to auto-create customers from deals, but:
- It referenced fields that don't exist
- It was broken from the start (Migration 030)
- It's not needed because:
  - Deals from customer page already have `customer_id`
  - Deals from deals page can manually link to customer
  - Lead conversion should be explicit

## Impact After Fix

✅ **WORKING:**
- Create deals from customer page
- Create deals from deals page
- Link deals to existing customers
- All deal operations

❌ **NO LONGER WORKS (was broken anyway):**
- Auto-creating customers from deals
- Converting leads to customers via deal creation

## Other Fixes in This Update

1. **Call Persistence** - Removed conflicting `GlobalVoiceHandler`, calls now persist across navigation
2. **DTMF Keypad** - Already exists, click # button during connected call
3. **Incoming Calls** - Now handled by CallContext with toast notifications

---

**Priority:** CRITICAL - Run Migration 040 NOW to restore deal creation functionality!
