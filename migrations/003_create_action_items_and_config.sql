-- Migration: Create action items, bot configuration, and privacy audit tables
-- This migration sets up the core tables for the enhanced bot functionality

CREATE TABLE IF NOT EXISTS action_items (
    id VARCHAR(16) PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    action_items JSONB NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(20) CHECK (category IN ('meeting', 'project', 'general', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    source_type VARCHAR(20) DEFAULT 'direct' CHECK (source_type IN ('direct', 'sweep')),
    completed_at TIMESTAMP WITH TIME ZONE,
    archived BOOLEAN DEFAULT FALSE
);

-- Bot configuration table
CREATE TABLE IF NOT EXISTS bot_config (
    guild_id VARCHAR(50) PRIMARY KEY,
    channels_to_monitor JSONB DEFAULT '[]'::jsonb,
    todo_channel_id VARCHAR(50),
    sweep_interval_hours INTEGER DEFAULT 1,
    last_sweep_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    privacy_mode_enabled BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Privacy audit log (for compliance)
CREATE TABLE IF NOT EXISTS privacy_audit (
    id SERIAL PRIMARY KEY,
    user_id_hash VARCHAR(64), -- Hashed user ID
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_action_items_channel_id ON action_items(channel_id);
CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON action_items(created_at);
CREATE INDEX IF NOT EXISTS idx_action_items_processed ON action_items(processed);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_bot_config_active ON bot_config(active);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_timestamp ON privacy_audit(timestamp);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for bot_config updates
CREATE TRIGGER update_bot_config_updated_at 
    BEFORE UPDATE ON bot_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample configuration insert
INSERT INTO bot_config (guild_id, channels_to_monitor, todo_channel_id, sweep_interval_hours, privacy_mode_enabled) 
VALUES (
    'YOUR_GUILD_ID', 
    '["CHANNEL_ID_1", "CHANNEL_ID_2"]'::jsonb,
    'TODO_CHANNEL_ID',
    1,
    false
) ON CONFLICT (guild_id) DO NOTHING; 