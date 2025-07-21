-- Migration: Add sweep output channel and active status
-- Date: 2024-01-XX
-- Description: Adds support for dedicated sweep output channels and sweep enable/disable

-- Add sweep output channel ID column
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS sweep_output_channel_id VARCHAR(20);

-- Add active status column with default true
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN bot_config.sweep_output_channel_id IS 'Discord channel ID for sweep results output (overrides todo_channel_id for sweep)';
COMMENT ON COLUMN bot_config.active IS 'Whether scheduled sweep is enabled for this guild';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bot_config' 
AND column_name IN ('sweep_output_channel_id', 'active'); 