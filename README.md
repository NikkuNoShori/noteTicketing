# NoteTicketing: n8n + Vercel AI SDK Integration Assistant

## Overview
This project is a professional assistant designed to seamlessly integrate [n8n](https://n8n.io/) automated workflows with the [Vercel AI SDK](https://sdk.vercel.ai/docs). It provides a secure, scalable, and maintainable backend for processing, summarizing, and managing conversational data—ideal for use cases like Discord bots, ticketing, and executive assistants.

## Features
- **API-First Architecture:** Uses Next.js API routes for robust, serverless endpoints.
- **AI Summarization:** Leverages OpenAI LLMs (via Vercel AI SDK) to summarize conversations and extract action items.
- **n8n Integration:** Designed to be called from n8n workflows for automation and orchestration.
- **Persistent Rate Limiting:** Uses Neon Postgres to track and limit API usage per client/IP.
- **Security Best Practices:** Bearer token authentication, environment variable management, and strict .gitignore rules.
- **Extensible:** Easily add more endpoints, models, or workflow integrations.

## Architecture
- **Next.js**: Provides the API layer (see `/api/summarize.ts`).
- **Vercel AI SDK**: Standardizes LLM access (OpenAI, OpenRouter, etc.).
- **Neon Postgres**: Stores rate limit data for persistent, scalable protection.
- **n8n**: Orchestrates workflows and calls the API endpoint.

## Setup
1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set environment variables** in `.env.local`:
   ```env
   OPENAI_API_KEY=your-openai-key
   MY_API_AUTH_TOKEN=your-strong-secret-token
   DATABASE_URL=your-neon-postgres-url
   ```
4. **Run the migration** to create the rate limit table:
   ```bash
   psql $DATABASE_URL -f migrations/001_create_api_rate_limits.sql
   ```
5. **Start the dev server**
   ```bash
   npm run dev
   ```

## Security Best Practices
- **Never commit `.env` files or secrets**—these are excluded by `.gitignore`.
- **Always use Bearer token authentication** for API endpoints.
- **Monitor and clean up rate limit data** in the database regularly.
- **Review `.cursorrules`** for project standards and workflow guidelines.

## Deployment
- **Vercel:** Deploys automatically with `next build`. Add your environment variables in the Vercel dashboard.
- **n8n Integration:** Use an HTTP Request node in n8n to call the `/api/summarize` endpoint, passing the `chatLog` and the correct Authorization header.

## Project Standards
- **.gitignore**: Excludes sensitive and build files.
- **.cursorrules**: Documents project rules, security, and workflow best practices.

---

**This project is built for professionals who want secure, scalable, and maintainable AI-powered workflow automation.**