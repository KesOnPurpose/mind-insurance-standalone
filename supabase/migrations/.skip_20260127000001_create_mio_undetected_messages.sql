-- Migration: Create mio_undetected_messages table
-- Purpose: Track messages where no patterns were detected for false negative analysis
-- Part of: MIO Intelligence Pattern Detection Optimization (FEAT-MIO-INTEL-004)

CREATE TABLE IF NOT EXISTS mio_undetected_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    conversation_id UUID,
    user_message TEXT NOT NULL,
    message_length INTEGER,
    word_count INTEGER,
    time_window TEXT,

    -- What was attempted
    keywords_checked INTEGER DEFAULT 0,
    ai_classification_attempted BOOLEAN DEFAULT FALSE,
    ai_classification_result JSONB,

    -- Detection results
    layer1_keywords_matched JSONB DEFAULT '[]'::jsonb,
    low_confidence_patterns JSONB DEFAULT '[]'::jsonb,  -- patterns below threshold
    protect_extractions_found INTEGER DEFAULT 0,

    -- Analysis flags
    review_status TEXT DEFAULT 'pending',  -- pending, reviewed, false_negative, true_negative
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    source_workflow TEXT DEFAULT 'protect-extract',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for analysis
    CONSTRAINT valid_review_status CHECK (review_status IN ('pending', 'reviewed', 'false_negative', 'true_negative'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_undetected_created_at ON mio_undetected_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_undetected_user_id ON mio_undetected_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_undetected_review_status ON mio_undetected_messages(review_status);
CREATE INDEX IF NOT EXISTS idx_undetected_message_length ON mio_undetected_messages(message_length);

-- Enable RLS
ALTER TABLE mio_undetected_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for N8n workflows)
CREATE POLICY "Service role full access on mio_undetected_messages" ON mio_undetected_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE mio_undetected_messages IS 'Tracks messages where no mindset patterns were detected for false negative analysis';
