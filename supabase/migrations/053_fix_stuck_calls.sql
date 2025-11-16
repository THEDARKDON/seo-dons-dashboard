-- Migration 053: Fix stuck calls and add cleanup function
-- This handles calls that are stuck in 'in-progress' status

-- Function to automatically fix stuck calls
CREATE OR REPLACE FUNCTION fix_stuck_calls()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update calls that have been in-progress for more than 10 minutes
    -- and have a duration, marking them as completed
    UPDATE call_recordings
    SET
        status = 'completed',
        ended_at = COALESCE(
            ended_at,
            created_at + (duration_seconds || ' seconds')::INTERVAL,
            created_at + INTERVAL '5 minutes' -- fallback if no duration
        )
    WHERE status IN ('in-progress', 'initiated')
      AND created_at < NOW() - INTERVAL '10 minutes'
      AND (duration_seconds > 0 OR created_at < NOW() - INTERVAL '1 hour');

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Run the fix immediately for existing stuck calls
SELECT fix_stuck_calls();

-- Add a comment
COMMENT ON FUNCTION fix_stuck_calls() IS 'Fixes calls stuck in in-progress or initiated status';

-- Create a scheduled job to run this periodically (if using pg_cron extension)
-- Uncomment if you have pg_cron installed:
/*
SELECT cron.schedule(
    'fix-stuck-calls',
    '*/30 * * * *', -- Run every 30 minutes
    'SELECT fix_stuck_calls();'
);
*/
