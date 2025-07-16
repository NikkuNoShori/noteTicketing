# NoteTicketing Discord Bot

A privacy-focused Discord bot that integrates with an external AI API to provide chat summarization and automatic action item detection.

## Features

- **Privacy Mode:** Optional conversation storage prevention
- **Scheduled Channel Sweeping:** Automatic action item detection every X hours
- **`/summarize` command:** Summarize messages from the last 1-24 hours
- **`/config` command:** Configure bot settings and privacy options
- **Integrates with external AI API** for intelligent summarization
- **Ephemeral responses** for clean user experience
- **GDPR-compliant audit logging**

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Create a `.env` file with:
   ```
   # Discord Bot
   DISCORD_TOKEN=your-discord-bot-token
   APPLICATION_ID=your-discord-application-id
   GUILD_ID=your-guild-id
   
   # API Configuration
   API_BASE_URL=https://your-api-domain.vercel.app
   MY_API_AUTH_TOKEN=your-strong-secret-token
   
   # Privacy (optional)
   HASH_SALT=your-random-salt-for-hashing
   ```

3. **Run the bot:**
   ```bash
   npm start
   ```

## Usage

### Basic Commands
- **`/summarize`** - Summarize messages from the last 1-24 hours
- **`/config`** - Configure bot settings (requires admin permissions)

### Configuration Commands
```
/config privacy enabled:true          # Enable privacy mode
/config channels add:#general         # Add channel to monitor
/config channels todo:#action-items   # Set todo channel
/config sweep interval:2              # Set sweep interval (hours)
```

### Privacy Mode
When enabled, privacy mode ensures:
- No conversation content is stored
- Only action items are extracted and saved
- Message IDs are tracked to avoid duplicates
- Privacy audit logs are maintained

### Scheduled Sweeping
The bot automatically sweeps configured channels every X hours to detect new action items and post them to the designated todo channel.

## API Integration

This bot calls an external AI API for summarization and channel sweeping. The API should be deployed separately and configured with the same authentication token.

### Database Setup
Run the database migrations before starting:
```bash
psql $DATABASE_URL -f migrations/001_create_api_rate_limits.sql
psql $DATABASE_URL -f migrations/002_create_message_tracking.sql
psql $DATABASE_URL -f migrations/003_create_action_items_and_config.sql
```

## Security & Privacy

- **Privacy Mode:** Prevents storage of conversation content
- **Audit Logging:** Tracks all bot activities for compliance
- **Rate Limiting:** Prevents API abuse
- **Authentication:** Bearer token protection for all endpoints
- **Data Minimization:** Only necessary data is stored

For detailed security documentation, see [docs/security-and-privacy.md](docs/security-and-privacy.md).

## Deployment

Deploy to your preferred platform (Render, Heroku, etc.) and set the environment variables in your deployment dashboard.

### Required Permissions
The bot needs the following Discord permissions:
- Send Messages
- Read Message History
- Use Slash Commands
- Manage Messages (for todo channel)