# noteTicketing

A Discord bot that relays summarized Discord channel messages to an n8n workflow for AI processing and storage in a Neon database.

## Features
- Registers a `/summarize` slash command in Discord
- Fetches recent messages from a channel (last 3 hours, up to 50 messages)
- Sends messages to an n8n webhook for further processing (e.g., AI summarization, NeonDB storage)

## How It Works
1. User types `/summarize` in a Discord channel
2. The bot fetches recent messages and POSTs them to the configured n8n webhook
3. n8n processes the data (e.g., with OpenRouter, stores results in NeonDB)

## Environment Variables
Create a `.env` file in the project root with the following:

```
DISCORD_TOKEN=your-discord-bot-token
APPLICATION_ID=your-discord-application-id
WEBHOOK_URL=https://your-n8n-domain/webhook/discord-ai-ingest
```

- `DISCORD_TOKEN`: Your Discord bot token from the Developer Portal
- `APPLICATION_ID`: Your Discord application (client) ID
- `WEBHOOK_URL`: The public URL of your n8n webhook (must be accessible from the internet)

## Local Development
1. Clone the repo
2. Run `npm install`
3. Create and fill out your `.env` file
4. Start the bot: `npm start`

## Deployment (Render Example)
- Deploy as a **Background Worker** (not a Web Service)
- Set environment variables in the Render dashboard (do not upload `.env`)
- Use `npm start` as the start command

## n8n Webhook Setup
- Add a Webhook node to your n8n workflow
- Set the path (e.g., `discord-ai-ingest`) and method (`POST`)
- Activate the workflow
- The production webhook URL is: `https://your-n8n-domain/webhook/discord-ai-ingest`
- The workflow must be active for the webhook to work

## Troubleshooting
- If you get a 404 from the webhook, ensure the workflow is active and the path/method match
- The n8n UI may show a localhost URL; use your public domain in the bot config

## Project Structure
- `index.js`: Main bot logic
- `.env`: Environment variables (not committed)
- `package.json`: Dependencies and scripts

## License
MIT