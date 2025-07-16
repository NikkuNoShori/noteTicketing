-- Migration: Create message tracking table for scheduled sweeps
-- This table tracks which messages have been processed to avoid duplicates

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

-- Index for efficient lookups by message and channel
CREATE INDEX IF NOT EXISTS idx_processed_messages_message_id
  ON processed_messages (message_id);

CREATE INDEX IF NOT EXISTS idx_processed_messages_channel_guild
  ON processed_messages (channel_id, guild_id);

CREATE INDEX IF NOT EXISTS idx_processed_messages_processed_at
  ON processed_messages (processed_at);

-- Table for storing action items separately (without conversation context)
CREATE TABLE IF NOT EXISTS action_items (
  id SERIAL PRIMARY KEY,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  action_item TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for action items
CREATE INDEX IF NOT EXISTS idx_action_items_channel_guild
  ON action_items (channel_id, guild_id);

CREATE INDEX IF NOT EXISTS idx_action_items_status
  ON action_items (status);

CREATE INDEX IF NOT EXISTS idx_action_items_created_at
  ON action_items (created_at); 