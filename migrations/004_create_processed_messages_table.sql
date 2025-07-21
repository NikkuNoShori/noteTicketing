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

CREATE INDEX IF NOT EXISTS idx_processed_messages_guild_id ON processed_messages(guild_id);
CREATE INDEX IF NOT EXISTS idx_processed_messages_channel_id ON processed_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_processed_messages_processed_at ON processed_messages(processed_at); 