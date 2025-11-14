# Call & Contact Tracking Analysis

## Executive Summary

This document analyzes how the system tracks contact status (calls, SMS, emails) and identifies potential issues with leads not showing as "contacted".

## How Contact Tracking Works

### 1. Call Tracking System

#### Call Flow
1. **Call Initiation** - [app/api/calling/save-call/route.ts](app/api/calling/save-call/route.ts)
   - Creates record in `call_recordings` table
   - Links to `lead_id`, `customer_id`, or `deal_id`
   - Initial status: `'initiated'`

2. **Call Progress** - [app/api/webhooks/twilio/voice/route.ts](app/api/webhooks/twilio/voice/route.ts)
   - Handles inbound calls
   - Creates call records for incoming calls

3. **Call Completion** - [app/api/calling/webhook/route.ts](app/api/calling/webhook/route.ts)
   - Receives Twilio status callback
   - Updates `status` to `'completed'`
   - Records `duration_seconds` and `ended_at`
   - Triggers auto-send SMS/Email if configured

4. **Auto-Update Lead Status** - [supabase/migrations/043_update_lead_on_call.sql](supabase/migrations/043_update_lead_on_call.sql)
   - **Database Trigger**: `trigger_update_lead_on_call`
   - **Fires When**:
     - Call status = `'completed'`, OR
     - Call status = `'in-progress'` AND has `recording_url` (lead hung up first)
   - **Updates**:
     - `leads.last_contacted_at` = call end time
     - `leads.status` = `'contacted'` (only if currently `'new'`)
     - Creates `status_change` activity in `lead_activities`

#### Call History Display
- **Location**: [app/dashboard/calls/history/page.tsx](app/dashboard/calls/history/page.tsx)
- **Features**:
  - Joins `call_recordings` with `customers`, `leads`, and `deals` tables
  - Display priority: Customer name > Lead name > Phone number
  - Shows company names, deal names, SDR who made the call
  - Displays call status, duration, sentiment, transcription status

### 2. SMS & Email Tracking

#### Database Schema
Both `sms_messages` and `email_messages` tables have:
- `lead_id` column (links to leads)
- `customer_id` column (links to customers)
- `to_number` / `to_email` fields
- Direction tracking (`inbound`/`outbound`)

**CRITICAL FINDING**: There are **NO triggers** to update `last_contacted_at` for SMS or email messages. Only calls update contact status.

#### SMS/Email Tables
- `sms_messages` - [supabase/migrations/026_sms_email_system.sql](supabase/migrations/026_sms_email_system.sql:2-33)
- `email_messages` - [supabase/migrations/026_sms_email_system.sql](supabase/migrations/026_sms_email_system.sql:52-90)

## Potential Issues Identified

### Issue 1: Calls Not Linked to Leads
**Symptom**: Phone contact not showing as contacted after call

**Possible Causes**:
1. **Call record missing `lead_id`**
   - Call was made but not associated with a lead
   - Phone number doesn't match lead's stored phone
   - Lead was manually dialed without selecting from UI

2. **Phone Number Mismatch**
   - Lead has phone: `"5551234567"`
   - Call made to: `"+15551234567"` (E.164 format)
   - No match found, `lead_id` is NULL

3. **Call Never Completed**
   - Status stuck at `'initiated'`
   - Twilio webhook not received
   - Trigger doesn't fire because status != `'completed'`

### Issue 2: SMS/Email Don't Update Contact Status
**Finding**: Sending SMS or emails to leads does NOT update `last_contacted_at` or lead status.

**Impact**:
- Leads show as "new" even after multiple emails/texts
- Only phone calls trigger contact status updates
- Activity timeline may show SMS/email but lead status unchanged

### Issue 3: Contact Names Missing from Call History
**Status**: ✅ **NOT AN ISSUE** - Already implemented correctly

The call history page properly displays contact names by joining with leads/customers tables. If names aren't showing, the issue is likely:
- Call record missing `lead_id` or `customer_id`
- Lead/customer record missing `first_name` and `last_name`

## Diagnostic Queries

A comprehensive diagnostic SQL file has been created: [CALL_TRACKING_DIAGNOSTIC.sql](CALL_TRACKING_DIAGNOSTIC.sql)

Run these queries to identify:
1. ✅ Check if trigger exists in database
2. 🔍 Find calls without lead/customer IDs
3. ⚠️ Find completed calls that didn't update lead status
4. 📊 Find leads with calls but never marked as contacted
5. 🔢 Check phone number matching issues
6. 📞 Find phone number format mismatches
7. 🔄 Compare called numbers vs stored numbers

## Recommended Solutions

### Solution 1: Verify Trigger Installation
```sql
-- Check if trigger exists
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_lead_on_call';
```

If trigger doesn't exist, run: [supabase/migrations/043_update_lead_on_call.sql](supabase/migrations/043_update_lead_on_call.sql)

### Solution 2: Ensure Calls Are Linked to Leads
When making calls from UI, ensure:
- Lead is selected before call
- `lead_id` is passed to `save-call` API
- Phone number in lead matches called number

### Solution 3: Add SMS/Email Contact Tracking
**Required**: Create triggers similar to `update_lead_on_call` for:
- `sms_messages` table (update on outbound sent)
- `email_messages` table (update on outbound sent)

### Solution 4: Normalize Phone Numbers
Implement phone number normalization to ensure matching:
- Store all phones in E.164 format (`+1XXXXXXXXXX`)
- Convert on save/search
- Use function to compare numbers ignoring format

### Solution 5: Auto-Link Calls by Phone Number
Add trigger to auto-populate `lead_id` when call is created:
```sql
-- When call is created, try to find matching lead by phone
UPDATE call_recordings
SET lead_id = (
    SELECT id FROM leads
    WHERE phone = call_recordings.to_number
    LIMIT 1
)
WHERE lead_id IS NULL;
```

## System Components Reference

### Database Tables
- `call_recordings` - All call records
- `leads` - Lead information with `last_contacted_at`
- `customers` - Customer information
- `sms_messages` - SMS message history
- `email_messages` - Email message history
- `lead_activities` - Activity timeline

### API Routes
- `POST /api/calling/save-call` - Save new call record
- `POST /api/calling/webhook` - Twilio status callback
- `POST /api/webhooks/twilio/voice` - Twilio voice webhook
- `POST /api/webhooks/twilio/voice-client` - Browser call webhook

### Database Migrations
- `009_integrate_leads_with_calls.sql` - Initial call/lead integration
- `043_update_lead_on_call.sql` - **Current trigger version**
- `026_sms_email_system.sql` - SMS/email tables

### UI Pages
- `/dashboard/calls/history` - Call history list
- `/dashboard/calls/history/[id]` - Call detail page

## Next Steps

1. **Run diagnostic queries** from [CALL_TRACKING_DIAGNOSTIC.sql](CALL_TRACKING_DIAGNOSTIC.sql)
2. **Identify root cause**:
   - Missing lead_id on calls?
   - Phone number mismatches?
   - Trigger not installed?
   - Calls not completing?
3. **Implement solution** based on findings
4. **Consider adding** SMS/email contact tracking triggers
5. **Normalize phone numbers** for consistent matching

## Questions to Investigate

1. Are calls reaching `'completed'` status?
2. Do call records have `lead_id` populated?
3. Do leads have phone numbers in same format as called numbers?
4. Is the trigger installed and firing?
5. Should SMS/email also update contact status?
6. Are there naming/format differences between lead phones and dialed numbers?
