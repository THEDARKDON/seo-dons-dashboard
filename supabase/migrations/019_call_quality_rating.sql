-- Call Quality Rating System
-- Adds admin review capabilities for call recordings

-- ========================================
-- ADD QUALITY RATING COLUMNS
-- ========================================

ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- ========================================
-- INDEXES FOR ADMIN QUERIES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_call_recordings_reviewed ON call_recordings(reviewed_by, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_call_recordings_quality ON call_recordings(quality_rating DESC);
CREATE INDEX IF NOT EXISTS idx_call_recordings_flagged ON call_recordings(flagged_for_review) WHERE flagged_for_review = TRUE;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON COLUMN call_recordings.quality_rating IS 'Call quality score from 1-5 stars, assigned by admin/manager during review';
COMMENT ON COLUMN call_recordings.reviewed_by IS 'User ID of the admin/manager who reviewed this call';
COMMENT ON COLUMN call_recordings.reviewed_at IS 'Timestamp when the call was reviewed';
COMMENT ON COLUMN call_recordings.review_notes IS 'Admin notes about call quality, coaching points, etc.';
COMMENT ON COLUMN call_recordings.flagged_for_review IS 'Whether this call has been flagged for manager review';
COMMENT ON COLUMN call_recordings.flag_reason IS 'Reason why the call was flagged (e.g., negative sentiment, compliance issue)';
