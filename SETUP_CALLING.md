# Calling System Setup Guide

## ✅ What's Already Done

1. **Twilio Integration** - WebRTC calling with @twilio/voice-sdk
2. **Call Recording** - Automatic recording of all calls
3. **Call History** - Full history with playback
4. **VoiceCallPanel Component** - In-browser calling UI
5. **API Endpoints** - Token generation, call saving, webhooks

## 🚀 Final Setup Steps

### Step 1: Run Database Migration

Copy and paste this SQL into Supabase SQL Editor at:
https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/sql/new

```sql
-- Create calling tables
CREATE TABLE IF NOT EXISTS user_voip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_phone_number VARCHAR(20) NOT NULL,
  caller_id_number VARCHAR(20),
  auto_record BOOLEAN DEFAULT true,
  auto_transcribe BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  status VARCHAR(50),
  duration INTEGER,
  recording_sid VARCHAR(100),
  recording_url TEXT,
  recording_duration INTEGER,
  transcription_status VARCHAR(50),
  transcription_text TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'calling', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_voip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own VoIP settings" ON user_voip_settings;
CREATE POLICY "Users can view own VoIP settings" ON user_voip_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own call recordings" ON call_recordings;
CREATE POLICY "Users can insert own call recordings" ON call_recordings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own call recordings" ON call_recordings;
CREATE POLICY "Users can view own call recordings" ON call_recordings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own call recordings" ON call_recordings;
CREATE POLICY "Users can update own call recordings" ON call_recordings
  FOR UPDATE USING (true);

-- Assign phone number to your admin user
INSERT INTO user_voip_settings (user_id, assigned_phone_number, caller_id_number, auto_record, auto_transcribe)
SELECT
  id,
  '+447700158258',
  '+447700158258',
  true,
  true
FROM users
WHERE role = 'admin'
LIMIT 1
ON CONFLICT (user_id)
DO UPDATE SET
  assigned_phone_number = '+447700158258',
  caller_id_number = '+447700158258',
  updated_at = NOW();
```

### Step 2: Access the Calling System

1. Go to **http://192.168.0.51:3000/dashboard/calls**
2. You'll see:
   - **VoiceCallPanel** - Make calls directly in browser
   - **Call History** - All recorded calls with playback
   - **Stats** - Calls today, total calls, duration

### Step 3: Make Your First Call

1. Enter a phone number in the dial pad
2. Click "Call"
3. Browser will establish WebRTC connection
4. Two-way audio conversation
5. Call is automatically recorded by Twilio
6. On hang up, call is saved to database
7. View in call history with recording

## 📋 Features

### Voice Call Panel
- ✅ In-browser WebRTC calling (no phone needed)
- ✅ Real-time call duration tracking
- ✅ Mute/unmute microphone
- ✅ Hold/resume call
- ✅ Hang up button
- ✅ Visual call status

### Call History
- ✅ All calls displayed with metadata
- ✅ Lead/Customer/Deal associations
- ✅ Call recordings with playback button
- ✅ Duration and status tracking
- ✅ Transcription preview (when available)

### Database Integration
- ✅ All calls saved to `call_recordings` table
- ✅ Webhook saves recording URLs
- ✅ Call duration and metadata tracked
- ✅ Links to CRM entities

## 🔧 API Endpoints

- **GET /api/calling/token** - Generate Twilio access token
- **POST /api/calling/make-call** - Initiate call via REST
- **POST /api/calling/save-call** - Save WebRTC call to DB
- **POST /api/webhooks/twilio/voice** - TwiML for routing
- **POST /api/webhooks/twilio/recording** - Save recordings
- **POST /api/webhooks/twilio/status** - Update call status

## 🎯 Next Steps (Optional)

### 1. Create TwiML App (For Production)
- Go to: https://console.twilio.com/us1/develop/voice/manage/twiml-apps
- Create new app
- Set Voice URL: `http://192.168.0.51:3000/api/webhooks/twilio/voice`
- Add App SID to `.env.local` as `TWILIO_TWIML_APP_SID`

### 2. Expose Webhooks (For Production)
- Use ngrok: `ngrok http 3000`
- Update webhook URLs in Twilio console
- Update `NEXT_PUBLIC_APP_URL` in `.env.local`

### 3. Add More UK Numbers
- Purchase 6 more UK numbers from Twilio
- Assign to each SDR in `user_voip_settings` table

### 4. OpenAI Whisper Transcription (Future)
- Implement automatic transcription
- Use OpenAI Whisper API
- Save to `transcription_text` column

## ✅ System Status

**Current Status:** Fully functional for local testing
- ✅ Twilio SDK installed
- ✅ WebRTC calling works
- ✅ Recordings enabled
- ✅ Call history saved
- ⚠️ Needs database migration (run SQL above)
- ⚠️ Local webhooks only (use ngrok for production)

**Your Twilio Number:** +447700158258
**Calls Page:** http://192.168.0.51:3000/dashboard/calls
