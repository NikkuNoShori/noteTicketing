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

CREATE INDEX IF NOT EXISTS idx_sweep_history_guild_id ON sweep_history(guild_id);
CREATE INDEX IF NOT EXISTS idx_sweep_history_triggered_at ON sweep_history(triggered_at);
CREATE INDEX IF NOT EXISTS idx_sweep_history_status ON sweep_history(status); 