# Security and Privacy Features

## Overview

The NoteTicketing Discord bot has been enhanced with comprehensive security and privacy features to protect user conversations and ensure compliance with privacy regulations.

## Privacy Mode

### What is Privacy Mode?

Privacy Mode is a feature that ensures **no conversation content is stored** on our servers. When enabled:

- ✅ **Action items are extracted and stored** (without conversation context)
- ✅ **Message IDs are tracked** to avoid duplicate processing
- ✅ **Privacy audit logs** are maintained for compliance
- ❌ **Conversation content is NOT stored** in any database
- ❌ **User messages are NOT logged** or retained

### Enabling Privacy Mode

Use the Discord slash command:
```
/config privacy enabled:true
```

Or via API:
```bash
curl -X PATCH "https://your-api.com/api/bot-config" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guildId": "YOUR_GUILD_ID",
    "privacyModeEnabled": true
  }'
```

## Database Schema

### Action Items Table
```sql
CREATE TABLE action_items (
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
```

### Bot Configuration Table
```sql
CREATE TABLE bot_config (
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
```

### Privacy Audit Table
```sql
CREATE TABLE privacy_audit (
    id SERIAL PRIMARY KEY,
    user_id_hash VARCHAR(64), -- Hashed user ID
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

## Scheduled Channel Sweeping

### How It Works

The bot automatically sweeps configured channels every X hours to detect new action items:

1. **Fetches recent messages** from monitored channels
2. **Processes only new messages** (tracks message IDs)
3. **Extracts action items** using AI without storing conversation content
4. **Posts action items** to designated todo channel
5. **Updates sweep timestamp** for next run

### Configuration

#### Set Channels to Monitor
```
/config channels add:#general
/config channels add:#meetings
```

#### Set Todo Channel
```
/config channels todo:#action-items
```

#### Set Sweep Interval
```
/config sweep interval:2
```

### API Endpoints

#### Sweep Channels
```bash
POST /api/sweep-channels
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "guildId": "GUILD_ID",
  "channelId": "CHANNEL_ID",
  "messages": [...],
  "sweepType": "scheduled"
}
```

#### Bot Configuration
```bash
GET /api/bot-config?guildId=GUILD_ID
POST /api/bot-config
PATCH /api/bot-config
```

## Security Features

### Authentication
- **Bearer Token Authentication** required for all API endpoints
- **Environment Variable Protection** for sensitive data
- **Rate Limiting** to prevent abuse

### Data Protection
- **User ID Hashing** for privacy audit logs
- **No Plain Text Storage** of conversation content
- **Encrypted Database Connections** (Neon Postgres)

### Access Control
- **Administrator Permissions** required for bot configuration
- **Guild-Specific Settings** isolation
- **Ephemeral Responses** for sensitive commands

## Privacy Compliance

### GDPR Compliance
- **Right to be Forgotten**: Action items can be archived/deleted
- **Data Minimization**: Only necessary data is stored
- **Transparency**: Privacy audit logs track all actions
- **User Control**: Privacy mode can be enabled/disabled per server

### Data Retention
- **Action Items**: Stored until manually archived
- **Audit Logs**: Retained for compliance (configurable)
- **Rate Limit Data**: Automatically cleaned up
- **Conversation Content**: Never stored

## Environment Variables

### Required Variables
```env
# Database
DATABASE_URL=your-neon-postgres-url

# API Security
MY_API_AUTH_TOKEN=your-strong-secret-token
HASH_SALT=your-random-salt-for-hashing

# OpenAI
OPENAI_API_KEY=your-openai-key

# Discord Bot
DISCORD_TOKEN=your-discord-bot-token
APPLICATION_ID=your-discord-application-id
GUILD_ID=your-discord-server-id

# API Base URL (for bot to call API)
API_BASE_URL=https://your-api-domain.com
```

## Migration Guide

### Running Migrations
```bash
# Run all migrations
psql $DATABASE_URL -f migrations/001_create_api_rate_limits.sql
psql $DATABASE_URL -f migrations/002_create_message_tracking.sql
psql $DATABASE_URL -f migrations/003_create_action_items_and_config.sql
```

### Initial Setup
1. **Deploy the API** to your hosting platform
2. **Set environment variables** in your deployment
3. **Run database migrations**
4. **Deploy the Discord bot**
5. **Configure bot settings** using `/config` commands

## Monitoring and Logging

### Console Logs
The bot provides detailed logging for:
- Command invocations
- Channel sweep operations
- Error conditions
- Privacy mode status

### Privacy Audit Logs
All user interactions are logged with:
- Hashed user IDs
- Action type
- Timestamp
- Metadata (no sensitive content)

### Example Log Entry
```json
{
  "id": 1,
  "user_id_hash": "a1b2c3d4...",
  "action": "summarize_request",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "actionItemsFound": 3,
    "summaryLength": 150
  }
}
```

## Troubleshooting

### Common Issues

#### Bot Not Sweeping Channels
1. Check if channels are configured: `/config sweep`
2. Verify bot has read permissions in monitored channels
3. Check console logs for error messages

#### Privacy Mode Not Working
1. Verify privacy mode is enabled: `/config privacy enabled:true`
2. Check database for `privacy_mode_enabled` flag
3. Review privacy audit logs

#### Action Items Not Posting
1. Verify todo channel is set: `/config channels todo:#channel`
2. Check bot has write permissions in todo channel
3. Review API logs for errors

### Support

For security or privacy concerns:
1. Check privacy audit logs
2. Review console output
3. Verify environment variables
4. Test with privacy mode enabled/disabled

## Best Practices

### Security
- Use strong, unique tokens
- Rotate API keys regularly
- Monitor audit logs
- Enable privacy mode by default

### Privacy
- Minimize data collection
- Use hashed identifiers
- Provide user control
- Document data practices

### Performance
- Configure appropriate sweep intervals
- Monitor API rate limits
- Use efficient database queries
- Cache configuration data
