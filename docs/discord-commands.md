# Discord Commands Reference

This document provides a complete reference of all Discord slash commands available in the NoteTicketing bot. This can be used to build a frontend interface or command documentation.

## Command Overview

| Command | Description | Permissions Required |
|---------|-------------|---------------------|
| `/summarize` | Summarize recent messages | None |
| `/config` | Configure bot settings | Administrator |

---

## `/summarize` Command

### Description
Summarizes messages from the last N hours in the current channel and extracts action items.

### Usage
```
/summarize hours:<1-24>
```

### Parameters

| Parameter | Type | Required | Description | Choices |
|-----------|------|----------|-------------|---------|
| `hours` | Integer | Yes | Number of hours to look back | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24 |

### Examples
```
/summarize hours:3
/summarize hours:24
/summarize hours:1
```

### Response
- **Success**: Ephemeral message: "✅ Sent to AI for summarization!"
- **Error**: Ephemeral message: "❌ Error processing request"

### Behavior
1. Fetches recent messages from the channel
2. Filters messages within the specified time range
3. Sends to AI API for processing
4. Returns summary and action items via webhook

---

## `/config` Command

### Description
Configure bot settings for the current server. Requires administrator permissions.

### Usage
```
/config <subcommand> [options]
```

### Subcommands

#### `/config privacy`

**Description**: Configure privacy settings for the server.

**Usage**:
```
/config privacy enabled:<true/false>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | Boolean | Yes | Enable or disable privacy mode |

**Examples**:
```
/config privacy enabled:true
/config privacy enabled:false
```

**Response**:
- **Success**: "✅ Privacy mode enabled/disabled successfully!"
- **Error**: "❌ Error updating configuration"

**Behavior**:
- When enabled: No conversation content is stored, only action items
- When disabled: Standard processing mode

---

#### `/config channels`

**Description**: Configure channels to monitor and todo channel.

**Usage**:
```
/config channels [add:<channel>] [remove:<channel>] [todo:<channel>]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `add` | Channel | No | Add a channel to monitoring list |
| `remove` | Channel | No | Remove a channel from monitoring list |
| `todo` | Channel | No | Set the todo channel for action items |

**Examples**:
```
/config channels add:#general
/config channels remove:#old-channel
/config channels todo:#action-items
/config channels add:#meetings todo:#todos
```

**Response**:
- **Success**: "✅ Configuration updated: • Added #channel to monitoring • Removed #channel from monitoring • Set #channel as todo channel"
- **Error**: "❌ Error updating configuration"

**Behavior**:
- Monitored channels are swept for action items
- Todo channel receives formatted action item posts
- Multiple channels can be monitored simultaneously

---

#### `/config sweep`

**Description**: Configure sweep settings and view current configuration.

**Usage**:
```
/config sweep [interval:<1-24>]
```

**Parameters**:

| Parameter | Type | Required | Description | Min | Max |
|-----------|------|----------|-------------|-----|-----|
| `interval` | Integer | No | Sweep interval in hours | 1 | 24 |

**Examples**:
```
/config sweep interval:2
/config sweep interval:6
/config sweep
```

**Response**:
- **With interval**: "✅ Sweep interval updated to X hours!"
- **Without interval**: Shows current configuration:
  ```
  📋 Current configuration:
  • Sweep interval: X hours
  • Privacy mode: enabled/disabled
  • Monitored channels: X
  • Todo channel: set/not set
  ```
- **Error**: "❌ Error updating configuration"

**Behavior**:
- Sets how often the bot sweeps monitored channels
- When no interval provided, shows current settings
- Default interval is 1 hour

---

## Command Permissions

### `/summarize`
- **Required Bot Permissions**:
  - Read Message History
  - Send Messages
  - Use Slash Commands
- **Required User Permissions**: None

### `/config`
- **Required Bot Permissions**:
  - Send Messages
  - Use Slash Commands
- **Required User Permissions**: Administrator

---

## Command Registration

### Guild Commands (Development)
- Registered immediately for testing
- Available only in the specified guild
- Instant updates

### Global Commands (Production)
- Registered globally across all guilds
- Can take up to 1 hour to propagate
- Use for production deployments

---

## Error Handling

### Common Error Responses

| Error Type | Response | Cause |
|------------|----------|-------|
| Permission Denied | "❌ You need administrator permissions to configure the bot." | User lacks admin permissions |
| Configuration Not Found | "❌ No configuration found for this server." | Server not configured |
| API Error | "❌ Error processing request" | Backend API issues |
| Rate Limited | "Too many requests. Please try again later." | Rate limit exceeded |

### Error Logging
All errors are logged to console with:
- Command name
- User information
- Error details
- Stack trace (if available)

---

## Response Types

### Ephemeral Messages
- Only visible to the command user
- Automatically hidden after interaction
- Used for sensitive information and errors

### Channel Messages
- Visible to all channel members
- Used for action item posts
- Rich embeds with formatting

---

## Data Flow

### `/summarize` Flow
```
User Command → Bot → AI API → n8n Webhook → Discord Channel
```

### `/config` Flow
```
User Command → Bot → Config API → Database → Response
```

### Scheduled Sweep Flow
```
Timer → Bot → Channel Messages → Sweep API → Todo Channel
```

---

## Frontend Integration Points

### Command Data Structure
```json
{
  "commands": [
    {
      "name": "summarize",
      "description": "Summarize messages from the last N hours",
      "options": [
        {
          "name": "hours",
          "type": "INTEGER",
          "required": true,
          "choices": [
            {"name": "1 hour", "value": 1},
            {"name": "2 hours", "value": 2}
            // ... more choices
          ]
        }
      ]
    },
    {
      "name": "config",
      "description": "Configure bot settings for this server",
      "options": [
        {
          "name": "privacy",
          "type": "SUB_COMMAND",
          "options": [
            {
              "name": "enabled",
              "type": "BOOLEAN",
              "required": true
            }
          ]
        }
        // ... more subcommands
      ]
    }
  ]
}
```

### Configuration Data Structure
```json
{
  "guildId": "123456789",
  "channelsToMonitor": ["channel1", "channel2"],
  "todoChannelId": "todo-channel",
  "sweepIntervalHours": 2,
  "privacyModeEnabled": true,
  "active": true,
  "lastSweepTime": "2024-01-15T10:30:00Z"
}
```

---

## API Endpoints for Frontend

### Get Bot Configuration
```
GET /api/bot-config?guildId={guildId}
Authorization: Bearer {token}
```

### Update Bot Configuration
```
PATCH /api/bot-config
Authorization: Bearer {token}
Content-Type: application/json

{
  "guildId": "123456789",
  "privacyModeEnabled": true
}
```

### Get Action Items
```
GET /api/action-items?guildId={guildId}
Authorization: Bearer {token}
```

### Get Privacy Audit Logs
```
GET /api/privacy-audit?guildId={guildId}
Authorization: Bearer {token}
```

---

## Development Notes

### Command Registration
Commands are registered on bot startup:
- Guild commands for development (instant)
- Global commands for production (delayed)

### Permission Checking
- Bot checks user permissions before executing commands
- Administrator permission required for `/config`
- Bot permissions checked on startup

### Error Recovery
- Failed commands provide user-friendly error messages
- Detailed errors logged for debugging
- Graceful degradation when services unavailable

### Rate Limiting
- API calls are rate-limited per IP
- Bot respects Discord's rate limits
- Exponential backoff for retries

---

## Future Enhancements

### Planned Commands
- `/stats` - View bot usage statistics
- `/export` - Export action items to various formats
- `/search` - Search through action items
- `/archive` - Archive completed action items

### Planned Features
- Web dashboard for configuration
- Bulk channel management
- Advanced privacy controls
- Integration with external task managers 