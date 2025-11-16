-- Diagnostic: Find calls stuck in 'in-progress' or 'initiated' status

-- 1. Calls stuck in progress for more than 10 minutes
SELECT
    id,
    call_sid,
    to_number,
    from_number,
    status,
    duration_seconds,
    created_at,
    ended_at,
    recording_url,
    lead_id,
    customer_id,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS minutes_since_created
FROM call_recordings
WHERE status IN ('in-progress', 'initiated')
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- 2. Count calls by status
SELECT
    status,
    COUNT(*) as count,
    AVG(duration_seconds) as avg_duration,
    MAX(created_at) as most_recent
FROM call_recordings
GROUP BY status
ORDER BY count DESC;

-- 3. Calls that have duration but still showing in-progress
SELECT
    id,
    call_sid,
    status,
    duration_seconds,
    created_at,
    ended_at,
    lead_id,
    recording_url IS NOT NULL as has_recording
FROM call_recordings
WHERE status = 'in-progress'
  AND duration_seconds > 0
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check if trigger is working - leads that should be contacted
SELECT
    l.id,
    l.first_name,
    l.last_name,
    l.status as lead_status,
    l.last_contacted_at,
    cr.call_sid,
    cr.status as call_status,
    cr.duration_seconds,
    cr.created_at as call_time,
    cr.recording_url IS NOT NULL as has_recording
FROM leads l
JOIN call_recordings cr ON l.id = cr.lead_id
WHERE cr.status = 'in-progress'
  AND cr.duration_seconds > 0
ORDER BY cr.created_at DESC
LIMIT 20;

-- 5. Fix stuck calls that have duration (MANUAL FIX)
-- Uncomment to run:
/*
UPDATE call_recordings
SET
    status = 'completed',
    ended_at = COALESCE(ended_at, created_at + (duration_seconds || ' seconds')::INTERVAL)
WHERE status = 'in-progress'
  AND duration_seconds > 0
  AND created_at < NOW() - INTERVAL '5 minutes';
*/
