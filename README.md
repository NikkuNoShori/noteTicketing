# NoteTicketing Discord Bot

A Discord bot that integrates with an external AI API to provide chat summarization functionality.

## Features

- `/summarize` command to summarize messages from the last 1-24 hours
- Integrates with external AI API for intelligent summarization
- Ephemeral responses for clean user experience

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Create a `.env` file with:
   ```
   DISCORD_TOKEN=your-discord-bot-token
   APPLICATION_ID=your-discord-application-id
   GUILD_ID=your-guild-id
   API_BASE_URL=https://your-api-domain.vercel.app
   API_AUTH_TOKEN=your-strong-secret-token
   ```

3. **Run the bot:**
   ```bash
   npm start
   ```

## Usage

Use the `/summarize` command in any channel and select the number of hours to look back. The bot will fetch recent messages and send them to the AI API for summarization.

## API Integration

This bot calls an external AI API for summarization. The API should be deployed separately and configured with the same authentication token.

## Deployment

Deploy to your preferred platform (Render, Heroku, etc.) and set the environment variables in your deployment dashboard.