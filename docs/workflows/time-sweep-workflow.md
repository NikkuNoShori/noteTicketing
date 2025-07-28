# Time Sweep Workflow

## Overview

The Time Sweep workflow is the n8n workflow responsible for automated channel monitoring and action item extraction. It runs on a scheduled basis (hourly) to scan configured Discord channels for new messages and extract action items automatically.

## Workflow Name
`Discord Channel Sweep`

## Trigger
- **Type**: Cron (Scheduled)
- **Frequency**: Hourly
- **Purpose**: Automated channel monitoring

## Workflow Components

### 1. Hourly Trigger (Cron Node)
- **Type**: Cron
- **Purpose**: Triggers workflow every hour
- **Schedule**: Hourly intervals
- **Functionality**: Starts the automated sweep process

### 2. Get Bot Config (PostgreSQL Node)
- **Type**: PostgreSQL
- **Purpose**: Retrieves active bot configurations
- **Functionality**:
  - Queries `bot_config` table
  - Filters for active configurations
  - Gets channels to monitor and settings

### 3. Process Configs (Code Node)
- **Type**: Code
- **Purpose**: Processes bot configurations for each channel
- **Functionality**:
  - Iterates through configured channels
  - Extracts monitoring settings
  - Prepares data for each channel sweep

### 4. Fetch Channel Messages (HTTP Request)
- **Type**: HTTP Request
- **Purpose**: Fetches recent messages from Discord channels
- **Functionality**:
  - Calls Discord API
  - Gets messages since last sweep
  - Handles rate limiting and pagination

### 5. Filter Actionable Messages (Code Node)
- **Type**: Code
- **Purpose**: Filters messages that might contain action items
- **Functionality**:
  - Scans for keywords (todo, action, task, follow up, etc.)
  - Converts messages to chat format
  - Skips empty or non-actionable content

### 6. Sweep AI Agent (Agent Node)
- **Type**: LangChain Agent
- **Purpose**: Analyzes messages for action items
- **Model**: OpenRouter with GPT-4.1 nano
- **Functionality**:
  - Extracts action items from conversations
  - Assigns priority and category
  - Creates structured output

### 7. Sweep Output Parser
- **Type**: LangChain Output Parser
- **Purpose**: Ensures consistent AI output format
- **Schema**:
  ```json
  {
    "summary": "string",
    "action_items": [
      {
        "id": "string",
        "guild_id": "string",
        "channel_id": "string",
        "summary": "string",
        "text": "string",
        "priority": "low|medium|high",
        "category": "string",
        "status": "pending",
        "assigned_to": "string"
      }
    ]
  }
  ```

### 8. Format Sweep Output (Code Node)
- **Type**: Code
- **Purpose**: Formats AI output for Discord and database
- **Functionality**:
  - Creates Discord message format
  - Generates unique IDs for action items
  - Prepares data for database storage

### 9. Filter Duplicates (Code Node)
- **Type**: Code
- **Purpose**: Removes duplicate action items
- **Functionality**:
  - Compares with existing action items
  - Filters out duplicates
  - Updates message format

### 10. Send ToDo Update (HTTP Request)
- **Type**: HTTP Request
- **Purpose**: Posts action items to Discord todo channel
- **Functionality**:
  - Sends formatted message to Discord
  - Posts to configured todo channel
  - Handles Discord API communication

### 11. Update Sweep Time (PostgreSQL Node)
- **Type**: PostgreSQL
- **Purpose**: Updates last sweep timestamp
- **Functionality**:
  - Updates `bot_config` table
  - Records sweep completion time
  - Prevents duplicate processing

### 12. Insert Action Items (PostgreSQL Node)
- **Type**: PostgreSQL
- **Purpose**: Stores extracted action items
- **Functionality**:
  - Inserts action items into database
  - Handles upsert operations
  - Maintains data integrity

## Data Flow

```
Cron Trigger → Get Config → Process Configs → Fetch Messages → Filter Messages → AI Agent → Format Output → Send to Discord → Update Database
```

## Configuration

### Bot Configuration
The workflow reads from the `bot_config` table:
- **Active**: Only processes active configurations
- **Channels**: List of channels to monitor
- **Todo Channel**: Output channel for action items
- **Sweep Interval**: How often to run (default: hourly)
- **Last Sweep Time**: Prevents duplicate processing

### Message Filtering
The workflow filters messages for actionable content:
- **Keywords**: todo, action, task, follow up, remind, deadline, due, need to, should, must
- **Time Range**: Since last sweep
- **Limit**: 100 messages per channel

## Output Format

### Discord Message
```
🔄 **Sweep Update - [timestamp]**

**Summary:** [AI-generated summary]

**New Action Items:**
1. [Action item 1]
2. [Action item 2]

*Priority: medium | Category: general*
```

### Database Storage
Action items are stored in the `action_items` table with:
- **Unique ID**: Generated for each item
- **Source Information**: Channel, guild, timestamp
- **Priority & Category**: AI-assigned values
- **Status**: Default to 'pending'

## Privacy Features

- **Message Tracking**: Only processes new messages since last sweep
- **No Content Storage**: Original messages not stored, only action items
- **Duplicate Prevention**: Tracks processed message IDs

## Error Handling

- **API Failures**: Graceful degradation
- **Empty Results**: Skips processing if no actionable content
- **Database Errors**: Logged for debugging
- **Discord API Limits**: Handles rate limiting

## Performance

- **Processing Time**: Typically 30-60 seconds per sweep
- **Message Limit**: 100 messages per channel per sweep
- **Concurrent Processing**: Handles multiple channels simultaneously
- **Rate Limiting**: Respects Discord API limits

## Monitoring

- **Sweep History**: Tracks execution times and results
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Processing time and success rates
- **Database Updates**: Tracks last sweep times
