# 📞 Twilio Webhook Configuration - Quick Reference

## ⚠️ IMPORTANT: Correct Webhook URLs

### For Each Twilio Phone Number:

Go to **Twilio Console** → **Phone Numbers** → **Active Numbers** → Click on your number

---

## 1️⃣ Voice Configuration

**When "A CALL COMES IN":**
```
URL: https://www.seodonscrm.co.uk/api/webhooks/twilio/voice
Method: HTTP POST
```

✅ **This is the main webhook** - controls call behavior (TwiML)
❌ **NOT the status callback!**

---

## 2️⃣ Status Callback Configuration

**Primary Handler Status Callback:**
```
URL: https://www.seodonscrm.co.uk/api/webhooks/twilio/status
Method: HTTP POST
```

**Check these events:**
- ☑️ Initiated
- ☑️ Ringing
- ☑️ Answered
- ☑️ Completed

✅ **This updates call status** in your database
✅ Runs for every status change

---

## 3️⃣ Screenshot of Correct Setup

```
┌─────────────────────────────────────────────────┐
│ Voice & Fax                                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Configure With:    [Webhooks, TwiML Bins, ... ▼│
│                                                 │
│ A CALL COMES IN                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ https://www.seodonscrm.co.uk/api/webhooks/│ │
│ │ twilio/voice                                │ │
│ └─────────────────────────────────────────────┘ │
│ [HTTP POST ▼]                                   │
│                                                 │
│ PRIMARY HANDLER FAILS                           │
│ [Leave empty or set fallback URL]              │
│                                                 │
│ CALL STATUS CHANGES                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ https://www.seodonscrm.co.uk/api/webhooks/│ │
│ │ twilio/status                               │ │
│ └─────────────────────────────────────────────┘ │
│ [HTTP POST ▼]                                   │
│                                                 │
│ ☑ Initiated  ☑ Ringing  ☑ Answered             │
│ ☑ Completed                                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔍 What Each Webhook Does

### `/api/webhooks/twilio/voice`
**Called:** When call is first initiated
**Returns:** TwiML XML telling Twilio what to do
**Example Response:**
```xml
<Response>
  <Dial record="record-from-answer">
    <Number>+447700900123</Number>
  </Dial>
</Response>
```

### `/api/webhooks/twilio/status`
**Called:** Multiple times during call lifecycle
**Updates:** Call status in `call_recordings` table
**Events:**
- `initiated` - Call started
- `ringing` - Phone is ringing
- `in-progress` - Call answered
- `completed` - Call ended
- `failed` / `busy` / `no-answer` - Call issues

### `/api/webhooks/twilio/recording`
**Called:** When recording is ready
**Updates:** Recording URL and duration
**Triggers:** Auto-transcription if enabled

---

## ✅ Quick Verification

### 1. Test Voice Webhook
```bash
curl -X POST https://www.seodonscrm.co.uk/api/webhooks/twilio/voice \
  -d "CallSid=CA123" \
  -d "From=%2B447700900123" \
  -d "To=%2B447700900456"
```

**Expected:** XML response with `<Response>` tag

### 2. Test Status Webhook
```bash
curl -X POST https://www.seodonscrm.co.uk/api/webhooks/twilio/status \
  -d "CallSid=CA123" \
  -d "CallStatus=completed" \
  -d "CallDuration=60"
```

**Expected:** `{"success":true}`

### 3. Test Recording Webhook
```bash
curl -X POST https://www.seodonscrm.co.uk/api/webhooks/twilio/recording \
  -d "CallSid=CA123" \
  -d "RecordingSid=RE123" \
  -d "RecordingUrl=https://api.twilio.com/..." \
  -d "RecordingDuration=60"
```

**Expected:** `{"success":true}`

---

## 🐛 Common Mistakes

### ❌ WRONG: Status URL as Voice URL
```
A CALL COMES IN → .../twilio/status  ← WRONG!
```
**Result:** Call fails, no TwiML response

### ❌ WRONG: Voice URL as Status URL
```
CALL STATUS CHANGES → .../twilio/voice  ← WRONG!
```
**Result:** Status updates return XML instead of updating DB

### ✅ CORRECT: Separate URLs
```
A CALL COMES IN → .../twilio/voice       ✓
CALL STATUS CHANGES → .../twilio/status  ✓
```

---

## 📊 Check Webhook Logs

### In Vercel:
1. Go to **Vercel Dashboard** → **Logs**
2. Filter by `/api/webhooks/twilio/`
3. Look for:
   - `Twilio voice webhook:` - Voice calls
   - `Twilio status webhook:` - Status updates
   - `Twilio recording webhook:` - Recording ready

### In Twilio Console:
1. Go to **Monitor** → **Logs** → **Calls**
2. Click on a call
3. Scroll to **Webhooks & Logs**
4. See all webhook requests and responses

---

## 🎯 Current Configuration Status

**Your current phone number webhook:** `https://www.seodonscrm.co.uk/api/webhooks/twilio/status`

**Issue:** ❌ You have the status callback URL set as the voice URL
**Fix:** Change "A CALL COMES IN" to: `https://www.seodonscrm.co.uk/api/webhooks/twilio/voice`

---

## 📝 Step-by-Step Fix

1. **Log into Twilio Console**
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your phone number: **+441474554816** (or whichever you purchased)
4. Scroll to **Voice Configuration**
5. Find **"A CALL COMES IN"**
6. Change URL from:
   ```
   https://www.seodonscrm.co.uk/api/webhooks/twilio/status
   ```
   To:
   ```
   https://www.seodonscrm.co.uk/api/webhooks/twilio/voice
   ```
7. Keep **"CALL STATUS CHANGES"** as:
   ```
   https://www.seodonscrm.co.uk/api/webhooks/twilio/status
   ```
8. Click **Save**

---

## ✅ After Fixing

Test by making a call:
1. Log into CRM as SDR (with assigned phone number)
2. Go to a Lead or Customer
3. Click the phone icon to call
4. Should hear dialing tone
5. Check Vercel logs for webhook activity
6. Check Twilio Console → Calls for call record

---

## 🆘 Still Not Working?

**Check these:**
1. ✅ Twilio credentials in Vercel environment variables
2. ✅ Phone number assigned to user in `user_voip_settings`
3. ✅ All three webhook URLs are different and correct
4. ✅ Webhooks are set to **HTTP POST** (not GET)
5. ✅ `NEXT_PUBLIC_APP_URL` is set to `https://www.seodonscrm.co.uk`

**View logs:**
- Vercel: Dashboard → Logs → Filter `/api/webhooks/twilio/`
- Twilio: Monitor → Logs → Calls → Click call → Webhook Logs

---

## 🎬 Complete Call Flow

```
1. SDR clicks "Call" button in CRM
   ↓
2. POST /api/calling/make-call
   ↓
3. Twilio receives request, initiates call
   ↓
4. Twilio calls: /api/webhooks/twilio/voice
   ← Returns TwiML to connect call
   ↓
5. Phone rings (status: initiated → ringing)
   → Twilio calls: /api/webhooks/twilio/status
   ↓
6. Call answered (status: in-progress)
   → Twilio calls: /api/webhooks/twilio/status
   ↓
7. Call recording happens
   ↓
8. Call ends (status: completed)
   → Twilio calls: /api/webhooks/twilio/status
   ↓
9. Recording ready
   → Twilio calls: /api/webhooks/twilio/recording
   ↓
10. Auto-transcription triggered (if enabled)
    ↓
11. Sentiment analysis runs
    ↓
12. Call record complete with transcript & insights
```

---

## 📄 Quick Copy-Paste

**Voice Webhook:**
```
https://www.seodonscrm.co.uk/api/webhooks/twilio/voice
```

**Status Webhook:**
```
https://www.seodonscrm.co.uk/api/webhooks/twilio/status
```

**Recording Webhook:**
```
https://www.seodonscrm.co.uk/api/webhooks/twilio/recording
```

---

All webhooks configured ✅
Calls should now work! 🎉
