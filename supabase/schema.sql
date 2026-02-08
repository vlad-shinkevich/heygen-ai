-- ============================================
-- Supabase Schema for HeyGen Telegram Mini App
-- ============================================

-- Table: allowed_users
-- Stores Telegram users who have access to the app
CREATE TABLE IF NOT EXISTS allowed_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by telegram_id
CREATE INDEX IF NOT EXISTS idx_allowed_users_telegram_id ON allowed_users(telegram_id);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_allowed_users_active ON allowed_users(is_active) WHERE is_active = true;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_allowed_users_updated_at ON allowed_users;
CREATE TRIGGER update_allowed_users_updated_at
    BEFORE UPDATE ON allowed_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
DROP POLICY IF EXISTS "Service role has full access" ON allowed_users;
CREATE POLICY "Service role has full access" ON allowed_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Example data (optional - for testing)
-- ============================================

-- INSERT INTO allowed_users (telegram_id, username, first_name, notes)
-- VALUES 
--     (123456789, 'example_user', 'John', 'Admin user'),
--     (987654321, 'another_user', 'Jane', 'Test user');

-- ============================================
-- Useful queries
-- ============================================

-- Add a new allowed user:
-- INSERT INTO allowed_users (telegram_id, username, first_name, notes)
-- VALUES (YOUR_TELEGRAM_ID, 'username', 'FirstName', 'Notes');

-- Deactivate a user:
-- UPDATE allowed_users SET is_active = false WHERE telegram_id = YOUR_TELEGRAM_ID;

-- Reactivate a user:
-- UPDATE allowed_users SET is_active = true WHERE telegram_id = YOUR_TELEGRAM_ID;

-- List all users:
-- SELECT * FROM allowed_users ORDER BY created_at DESC;

-- Delete a user:
-- DELETE FROM allowed_users WHERE telegram_id = YOUR_TELEGRAM_ID;

-- ============================================
-- Table: video_generations
-- Stores video generation history and tracks credits
-- ============================================

CREATE TABLE IF NOT EXISTS video_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    video_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    video_url TEXT,
    thumbnail_url TEXT,
    credits_used INTEGER DEFAULT 0,
    input_type TEXT NOT NULL, -- 'text' or 'audio'
    avatar_id TEXT NOT NULL,
    avatar_name TEXT,
    voice_id TEXT, -- Only for text input
    input_text TEXT, -- Only for text input
    audio_url TEXT, -- Only for audio input
    aspect_ratio TEXT DEFAULT '16:9',
    avatar_style TEXT DEFAULT 'normal',
    test_mode BOOLEAN DEFAULT false,
    sent_to_telegram BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to allowed_users
    CONSTRAINT fk_telegram_user FOREIGN KEY (telegram_id) 
        REFERENCES allowed_users(telegram_id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_video_generations_telegram_id ON video_generations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_video_id ON video_generations(video_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON video_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_generations_sent ON video_generations(sent_to_telegram) WHERE sent_to_telegram = false;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_video_generations_updated_at ON video_generations;
CREATE TRIGGER update_video_generations_updated_at
    BEFORE UPDATE ON video_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access" ON video_generations;
CREATE POLICY "Service role has full access" ON video_generations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Table: credit_tracking
-- Tracks total credits usage per user
-- ============================================

CREATE TABLE IF NOT EXISTS credit_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    total_credits_used INTEGER DEFAULT 0,
    last_quota_check TIMESTAMP WITH TIME ZONE,
    last_remaining_quota INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to allowed_users
    CONSTRAINT fk_credit_user FOREIGN KEY (telegram_id) 
        REFERENCES allowed_users(telegram_id) ON DELETE CASCADE
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_credit_tracking_telegram_id ON credit_tracking(telegram_id);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_credit_tracking_updated_at ON credit_tracking;
CREATE TRIGGER update_credit_tracking_updated_at
    BEFORE UPDATE ON credit_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE credit_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access" ON credit_tracking;
CREATE POLICY "Service role has full access" ON credit_tracking
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Table: user_settings
-- Stores user video generation settings
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    avatar_id TEXT NOT NULL,
    avatar_name TEXT,
    avatar_image_url TEXT,
    avatar_type TEXT DEFAULT 'avatar', -- 'avatar' or 'talking_photo'
    voice_id TEXT NOT NULL,
    aspect_ratio TEXT DEFAULT '16:9',
    avatar_style TEXT DEFAULT 'normal',
    background JSONB,
    current_menu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to allowed_users
    CONSTRAINT fk_settings_user FOREIGN KEY (telegram_id) 
        REFERENCES allowed_users(telegram_id) ON DELETE CASCADE
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_telegram_id ON user_settings(telegram_id);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access" ON user_settings;
CREATE POLICY "Service role has full access" ON user_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Function: Update credit tracking
-- ============================================

CREATE OR REPLACE FUNCTION update_credit_tracking(
    p_telegram_id BIGINT,
    p_credits_used INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO credit_tracking (telegram_id, total_credits_used)
    VALUES (p_telegram_id, p_credits_used)
    ON CONFLICT (telegram_id) 
    DO UPDATE SET 
        total_credits_used = credit_tracking.total_credits_used + p_credits_used,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Useful queries for video_generations
-- ============================================

-- Get user's generation history:
-- SELECT * FROM video_generations 
-- WHERE telegram_id = YOUR_TELEGRAM_ID 
-- ORDER BY created_at DESC;

-- Get pending/completing videos that need to be sent:
-- SELECT * FROM video_generations 
-- WHERE status IN ('processing', 'completed') 
-- AND sent_to_telegram = false
-- ORDER BY created_at ASC;

-- Get total credits used by user:
-- SELECT total_credits_used FROM credit_tracking 
-- WHERE telegram_id = YOUR_TELEGRAM_ID;

-- Get user's generation stats:
-- SELECT 
--     COUNT(*) as total_generations,
--     SUM(credits_used) as total_credits,
--     COUNT(*) FILTER (WHERE status = 'completed') as completed,
--     COUNT(*) FILTER (WHERE status = 'failed') as failed
-- FROM video_generations 
-- WHERE telegram_id = YOUR_TELEGRAM_ID;

-- ============================================
-- Migration: Add avatar_image_url to user_settings
-- Run this if the table already exists
-- ============================================
-- ALTER TABLE user_settings 
-- ADD COLUMN IF NOT EXISTS avatar_image_url TEXT;

-- ============================================
-- Migration: Add current_menu to user_settings
-- Run this if the table already exists
-- ============================================
-- ALTER TABLE user_settings 
-- ADD COLUMN IF NOT EXISTS current_menu TEXT;

-- Migration: Add avatar_type to user_settings
-- Run this if the column doesn't exist yet
-- ============================================
-- ALTER TABLE user_settings 
-- ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'avatar';

