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

