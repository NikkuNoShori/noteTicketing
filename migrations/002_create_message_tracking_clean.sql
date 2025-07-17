CREATE TABLE IF NOT EXISTS processed_messages (
  id SERIAL PRIMARY KEY,
  message_id TEXT NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_items_found BOOLEAN DEFAULT FALSE,
  summary_generated TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_messages_message_id
  ON processed_messages (message_id);

CREATE INDEX IF NOT EXISTS idx_processed_messages_channel_guild
  ON processed_messages (channel_id, guild_id);

CREATE INDEX IF NOT EXISTS idx_processed_messages_processed_at
  ON processed_messages (processed_at); 