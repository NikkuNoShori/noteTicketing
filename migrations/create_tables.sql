-- NoteTicketing Bot Database Schema
-- This migration creates all necessary tables for the API

-- Action Items Table
CREATE TABLE IF NOT EXISTS action_items (
    id VARCHAR(24) PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL,
    summary TEXT,
    text TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
    assigned_to VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for action_items
CREATE INDEX IF NOT EXISTS idx_action_items_guild_id ON action_items(guild_id);
CREATE INDEX IF NOT EXISTS idx_action_items_channel_id ON action_items(channel_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON action_items(created_at);

-- Sweep History Table
CREATE TABLE IF NOT EXISTS sweep_history (
    id VARCHAR(16) PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    channels_processed INTEGER DEFAULT 0,
    messages_processed INTEGER DEFAULT 0,
    action_items_found INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    duration_seconds INTEGER DEFAULT 0,
    error_message TEXT
);

-- Create indexes for sweep_history
CREATE INDEX IF NOT EXISTS idx_sweep_history_guild_id ON sweep_history(guild_id);
CREATE INDEX IF NOT EXISTS idx_sweep_history_triggered_at ON sweep_history(triggered_at);
CREATE INDEX IF NOT EXISTS idx_sweep_history_status ON sweep_history(status);

-- Processed Messages Table
CREATE TABLE IF NOT EXISTS processed_messages (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL,
    message_id VARCHAR(20) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_type VARCHAR(20) DEFAULT 'sweep' CHECK (processing_type IN ('sweep', 'manual', 'webhook')),
    action_items_found INTEGER DEFAULT 0,
    UNIQUE(guild_id, channel_id, message_id)
);

-- Create indexes for processed_messages
CREATE INDEX IF NOT EXISTS idx_processed_messages_guild_id ON processed_messages(guild_id);
CREATE INDEX IF NOT EXISTS idx_processed_messages_channel_id ON processed_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_processed_messages_processed_at ON processed_messages(processed_at);

-- Privacy Audit Table
CREATE TABLE IF NOT EXISTS privacy_audit (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20),
    action VARCHAR(50) NOT NULL CHECK (action IN ('data_access', 'data_deletion', 'privacy_toggle', 'export_request', 'api_access')),
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for privacy_audit
CREATE INDEX IF NOT EXISTS idx_privacy_audit_guild_id ON privacy_audit(guild_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_user_id ON privacy_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_action ON privacy_audit(action);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_timestamp ON privacy_audit(timestamp);

-- API Keys Table (for future multi-tenant support)
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    guild_id VARCHAR(20),
    permissions JSONB DEFAULT '{}',
    rate_limit_per_hour INTEGER DEFAULT 1000,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_guild_id ON api_keys(guild_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Add comments for documentation
COMMENT ON TABLE action_items IS 'Stores extracted action items from Discord conversations';
COMMENT ON TABLE sweep_history IS 'Tracks sweep execution history and performance metrics';
COMMENT ON TABLE processed_messages IS 'Prevents duplicate processing of messages';
COMMENT ON TABLE privacy_audit IS 'GDPR compliance audit trail for data access and privacy actions';
COMMENT ON TABLE api_keys IS 'API key management for external frontend access';

-- Add column comments
COMMENT ON COLUMN action_items.id IS 'Unique identifier for the action item';
COMMENT ON COLUMN action_items.guild_id IS 'Discord guild/server ID';
COMMENT ON COLUMN action_items.channel_id IS 'Discord channel ID where item was found';
COMMENT ON COLUMN action_items.summary IS 'Brief summary of the action item context';
COMMENT ON COLUMN action_items.text IS 'The actual action item text';
COMMENT ON COLUMN action_items.priority IS 'Priority level: low, medium, high';
COMMENT ON COLUMN action_items.category IS 'Category classification (meeting, project, general, etc.)';
COMMENT ON COLUMN action_items.status IS 'Current status: pending, in_progress, completed, archived';
COMMENT ON COLUMN action_items.assigned_to IS 'Discord user ID assigned to this item';

COMMENT ON COLUMN sweep_history.id IS 'Unique sweep execution identifier';
COMMENT ON COLUMN sweep_history.guild_id IS 'Discord guild/server ID';
COMMENT ON COLUMN sweep_history.triggered_at IS 'When the sweep was triggered';
COMMENT ON COLUMN sweep_history.channels_processed IS 'Number of channels processed';
COMMENT ON COLUMN sweep_history.messages_processed IS 'Number of messages analyzed';
COMMENT ON COLUMN sweep_history.action_items_found IS 'Number of action items extracted';
COMMENT ON COLUMN sweep_history.status IS 'Sweep execution status';
COMMENT ON COLUMN sweep_history.duration_seconds IS 'How long the sweep took to complete';

COMMENT ON COLUMN processed_messages.guild_id IS 'Discord guild/server ID';
COMMENT ON COLUMN processed_messages.channel_id IS 'Discord channel ID';
COMMENT ON COLUMN processed_messages.message_id IS 'Discord message ID';
COMMENT ON COLUMN processed_messages.processing_type IS 'How the message was processed';
COMMENT ON COLUMN processed_messages.action_items_found IS 'Number of action items found in this message';

COMMENT ON COLUMN privacy_audit.guild_id IS 'Discord guild/server ID';
COMMENT ON COLUMN privacy_audit.user_id IS 'Discord user ID who performed the action';
COMMENT ON COLUMN privacy_audit.action IS 'Type of privacy-related action';
COMMENT ON COLUMN privacy_audit.details IS 'Additional details about the action';
COMMENT ON COLUMN privacy_audit.ip_address IS 'IP address of the request';
COMMENT ON COLUMN privacy_audit.user_agent IS 'User agent string from the request';

-- Verify the tables were created
SELECT 
    table_name,
    column_count,
    row_count
FROM (
    SELECT 
        'action_items' as table_name,
        COUNT(*) as column_count,
        0 as row_count
    FROM information_schema.columns 
    WHERE table_name = 'action_items'
    UNION ALL
    SELECT 
        'sweep_history' as table_name,
        COUNT(*) as column_count,
        0 as row_count
    FROM information_schema.columns 
    WHERE table_name = 'sweep_history'
    UNION ALL
    SELECT 
        'processed_messages' as table_name,
        COUNT(*) as column_count,
        0 as row_count
    FROM information_schema.columns 
    WHERE table_name = 'processed_messages'
    UNION ALL
    SELECT 
        'privacy_audit' as table_name,
        COUNT(*) as column_count,
        0 as row_count
    FROM information_schema.columns 
    WHERE table_name = 'privacy_audit'
    UNION ALL
    SELECT 
        'api_keys' as table_name,
        COUNT(*) as column_count,
        0 as row_count
    FROM information_schema.columns 
    WHERE table_name = 'api_keys'
) as table_info
ORDER BY table_name; 