# Discord Message Summary

## Overview

The Discord Message Summary feature allows users to generate AI-powered summaries of recent Discord conversations using the `/summarize` slash command. This feature integrates with OpenAI's GPT models to provide intelligent conversation analysis and action item extraction.

## Features

- **Time-based Summarization**: Summarize messages from the last 1-24 hours
- **AI-Powered Analysis**: Uses OpenAI GPT to generate intelligent summaries
- **Action Item Extraction**: Automatically identifies and lists action items from conversations
- **Slash Command Interface**: Easy-to-use `/summarize` command with hour selection
- **Rate Limiting**: Built-in rate limiting to prevent API abuse
- **Ephemeral Responses**: Bot responses are private to the command user

## How It Works

### User Flow
1. User types `/summarize` in a Discord channel
2. User selects number of hours (1-24) from dropdown
3. Bot fetches recent messages from the channel
4. Messages are sent to AI API for processing
5. Bot receives summary and action items
6. Bot posts formatted response to the channel

### Technical Flow
```
Discord Channel → Slash Command → Bot (index.js) → AI API → n8n Workflow → Discord Response
```

## Setup Requirements

### Environment Variables
```env
DISCORD_TOKEN=your_discord_bot_token
APPLICATION_ID=your_discord_application_id
GUILD_ID=your_discord_server_id
WEBHOOK_URL=your_n8n_webhook_url
```

### Dependencies
- `discord.js` - Discord bot framework
- `axios` - HTTP client for API calls
- `dotenv` - Environment variable management

## Usage

### Command Syntax
```
/summarize hours:<1-24>
```

### Available Time Options
- 1 hour through 24 hours (increments of 1)

### Example Usage
```
/summarize hours:3
```
This will summarize all messages from the last 3 hours in the current channel.

## Bot Permissions

The bot requires the following Discord permissions:
- **Send Messages** (2048) - To post summaries
- **Read Message History** (65536) - To fetch recent messages
- **Use Slash Commands** - To respond to slash commands

## API Integration

### AI API Endpoint
- **URL**: `POST /api/summarize`
- **Authentication**: Bearer token
- **Input**: JSON with chat log
- **Output**: Summary and action items

### Request Format
```json
{
  "chatLog": "user1: message1\nuser2: message2\nuser3: message3"
}
```

### Response Format
```json
{
  "summary": "Conversation summary...",
  "action_items": ["Action item 1", "Action item 2"]
}
```

## n8n Workflow Integration

The bot sends data to an n8n workflow via webhook for processing:

### Webhook Payload
```json
{
  "channel_id": "123456789",
  "user_id": "987654321",
  "hours": 3,
  "messages": [
    {"user": "username1", "text": "message content"},
    {"user": "username2", "text": "message content"}
  ]
}
```

### n8n Workflow Steps
1. **Webhook Trigger** - Receives data from Discord bot
2. **AI Processing** - Calls OpenAI API for summarization
3. **Discord Response** - Posts formatted summary back to channel

## Error Handling

### Common Issues
- **Missing Permissions**: Bot needs read/send message permissions
- **Rate Limiting**: API calls are limited to prevent abuse
- **Empty Conversations**: No messages found in specified time range
- **API Errors**: OpenAI API failures or network issues

### Error Responses
- Ephemeral error messages for user feedback
- Console logging for debugging
- Graceful degradation when services are unavailable

## Security Considerations

- **Bearer Token Authentication**: All API calls require valid tokens
- **Rate Limiting**: Prevents abuse and controls costs
- **Environment Variables**: Sensitive data stored securely
- **Ephemeral Messages**: Bot responses are private to command user

## Monitoring and Logging

### Console Output
The bot logs important events:
- Command invocations
- Message fetching results
- API call status
- Error conditions

### Key Log Messages
```
✅ Guild slash command registered successfully!
--- /summarize command invoked ---
Selected hours: 3
Fetched recent messages: [...]
Webhook response status: 200
```

## Troubleshooting

### Bot Not Responding
1. Check if bot is online in Discord
2. Verify environment variables are set
3. Check console logs for errors
4. Ensure bot has required permissions

### Command Not Available
1. Verify slash command registration
2. Check APPLICATION_ID and GUILD_ID
3. Restart bot to re-register commands
4. Wait up to 1 hour for global command propagation

### API Errors
1. Verify API authentication tokens
2. Check rate limiting status
3. Ensure webhook URL is correct
4. Monitor OpenAI API status

## Future Enhancements

### Planned Features
- **Multi-channel Summarization**: Summarize across multiple channels
- **Custom Time Ranges**: Allow custom start/end times
- **Summary Templates**: Different summary formats
- **Export Options**: PDF/CSV export of summaries
- **Scheduled Summaries**: Automatic daily/weekly summaries

### Technical Improvements
- **Caching**: Cache summaries to reduce API calls
- **Batch Processing**: Handle larger conversation volumes
- **Analytics**: Track usage patterns and popular channels
- **Web Dashboard**: Admin interface for bot management

## Related Files

- `index.js` - Main bot logic
- `send_discord_message_node.json` - n8n Discord message node
- `package.json` - Dependencies and scripts
- `render.yaml` - Render deployment configuration 