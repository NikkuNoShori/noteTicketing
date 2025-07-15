# NoteTicketing AI API

## Overview
This is the AI API backend for the NoteTicketing Discord bot. It provides secure, rate-limited AI summarization services using OpenAI and Neon Postgres.

## Features
- **AI Summarization:** Uses OpenAI to summarize Discord conversations
- **Rate Limiting:** Persistent rate limiting with Neon Postgres
- **Authentication:** Bearer token protection
- **n8n Integration:** Designed to be called from n8n workflows

## Setup
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables** in `.env.local`:
   ```env
   OPENAI_API_KEY=your-openai-key
   MY_API_AUTH_TOKEN=your-strong-secret-token
   DATABASE_URL=your-neon-postgres-url
   ```

3. **Run the migration** to create the rate limit table:
   ```bash
   psql $DATABASE_URL -f migrations/001_create_api_rate_limits.sql
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```

## API Usage
- **Endpoint:** `POST /api/summarize`
- **Headers:** `Authorization: Bearer your-token`
- **Body:** `{ "chatLog": "user1: message1\nuser2: message2" }`
- **Response:** `{ "summary": "...", "action_items": [...] }`

## Deployment
- Deploy to Vercel for serverless API hosting
- Add environment variables in Vercel dashboard
- The Discord bot (separate project) calls this API

## Security
- Bearer token authentication required
- Rate limiting: 10 requests per minute per IP
- Environment variables for sensitive data