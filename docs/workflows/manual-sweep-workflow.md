# Manual Sweep Workflow

## Overview

The Manual Sweep workflow is the n8n workflow responsible for processing the `/summarize` command from Discord. It receives messages from the Discord bot via webhook and returns AI-generated summaries with action items.

## Workflow Name
`Enhanced Discord Bot`

## Webhook Endpoint
- **Path**: `discord-ai-ingest`
- **Method**: POST
- **Webhook ID**: `ae0d7949-9d6c-4e52-800c-4b50fa853fa4`

## Workflow Components

### 1. Discord Message RX (Webhook Trigger)
- **Type**: Webhook
- **Purpose**: Receives data from Discord bot
- **Input**: Discord messages and metadata

### 2. Message Parser (Code Node)
- **Type**: Code
- **Purpose**: Formats messages for AI processing
- **Functionality**:
  - Handles single messages and message arrays
  - Extracts user and text content
  - Creates chat input format
  - Adds metadata (channel_id, user_id, hours, timestamp)

### 3. Privacy Check (If Node)
- **Type**: Conditional logic
- **Purpose**: Checks if privacy mode is enabled
- **Functionality**: Routes data to anonymizer or direct processing

### 4. Data Anonymizer (Code Node)
- **Type**: Code
- **Purpose**: Anonymizes sensitive data in privacy mode
- **Functionality**:
  - Replaces emails with `[EMAIL]`
  - Replaces phone numbers with `[PHONE]`
  - Replaces credit card numbers with `[CARD]`
  - Hashes user IDs for privacy

### 5. AI Conversation Analyzer (Agent Node)
- **Type**: LangChain Agent
- **Purpose**: Analyzes conversation content
- **Model**: OpenRouter with GPT-4.1 nano
- **Functionality**:
  - Summarizes conversations
  - Extracts action items
  - Assigns priority and category
  - Uses structured output parser

### 6. Structured Output Parser
- **Type**: LangChain Output Parser
- **Purpose**: Ensures consistent AI output format
- **Schema**:
  ```json
  {
    "summary": "string",
    "action_items": "array",
    "priority": "string",
    "category": "string"
  }
  ```

### 7. Response Formatter (Code Node)
- **Type**: Code
- **Purpose**: Formats AI output for Discord
- **Functionality**:
  - Creates formatted Discord message
  - Generates unique action item ID
  - Structures response for Discord API

### 8. Discord Message TX (HTTP Request)
- **Type**: HTTP Request
- **Purpose**: Sends response back to Discord
- **Functionality**:
  - Posts formatted message to Discord channel
  - Uses Discord Bot API
  - Handles message formatting

## Data Flow

```
Discord Bot → Webhook → Message Parser → Privacy Check → AI Agent → Response Formatter → Discord
```

## Input Format

The workflow expects input in this format:
```json
{
  "channel_id": "discord_channel_id",
  "user_id": "discord_user_id",
  "hours": 3,
  "messages": [
    {"user": "username", "text": "message content"},
    {"user": "username2", "text": "message content2"}
  ]
}
```

## Output Format

The workflow returns a formatted Discord message:
```
**Summary:**
[AI-generated summary]

**Action Items:**
1. [Action item 1]
2. [Action item 2]

*Priority: medium | Category: general*
```

## Privacy Features

- **Privacy Mode**: When enabled, sensitive data is anonymized
- **Data Hashing**: User IDs are hashed for privacy compliance
- **No Content Storage**: Conversation content is not stored, only action items

## Usage

This workflow is triggered when a user uses the `/summarize` command in Discord. The Discord bot:
1. Fetches recent messages from the channel
2. Sends them to this webhook
3. Receives the formatted response
4. Posts the response to the Discord channel

## Configuration

- **AI Model**: GPT-4.1 nano via OpenRouter
- **Processing**: Real-time webhook processing
- **Response Time**: Typically 2-5 seconds
- **Rate Limiting**: Handled by Discord bot

## Error Handling

- **Invalid Input**: Returns error response
- **AI Failures**: Graceful degradation
- **Discord API Errors**: Logged for debugging
- **Privacy Violations**: Automatic data anonymization
