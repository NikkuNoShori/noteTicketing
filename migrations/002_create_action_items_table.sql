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

CREATE INDEX IF NOT EXISTS idx_action_items_guild_id ON action_items(guild_id);
CREATE INDEX IF NOT EXISTS idx_action_items_channel_id ON action_items(channel_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON action_items(created_at); 