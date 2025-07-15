# API Refactor Plan: Separating AI API from Discord Bot

## Overview
This plan outlines how to properly separate the AI API functionality from the main Discord bot project, creating two independent projects.

## Current State
- **Main Project**: `C:\dev\noteTicketing` (Discord bot + API mixed)
- **API Project**: `C:\dev\noteTicketing-api` (needs proper setup)

## Step 1: Clean Up API Project Directory

### Files to Remove from `C:\dev\noteTicketing-api`:
```
- index.js (Discord bot file)
- send_discord_message_node.json (n8n Discord node)
- debug_node.json (n8n debug node)
- render.yaml (Discord bot deployment config)
- api/ (old API directory - if exists)
```

### Files to Keep in `C:\dev\noteTicketing-api`:
```
- package.json (already configured for API)
- tsconfig.json
- next-env.d.ts
- .gitignore
- .cursorrules
- app/api/summarize/route.ts (main API endpoint)
- pages/index.tsx (simple landing page)
- migrations/001_create_api_rate_limits.sql
- types/ai-openai.d.ts
- ai-openai.d.ts
- README.md
```

## Step 2: Move API Files from Main Project

### Copy these files from `C:\dev\noteTicketing` to `C:\dev\noteTicketing-api`:

1. **Environment Configuration**:
   - Create `.env.local` in API project with:
   ```
   OPENAI_API_KEY=your-openai-key
   MY_API_AUTH_TOKEN=your-strong-secret-token
   DATABASE_URL=your-neon-postgres-url
   ```

2. **Vercel Configuration**:
   - Create `vercel.json` in API project:
   ```json
   {
     "functions": {
       "app/api/summarize/route.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

## Step 3: Clean Up Main Discord Bot Project

### Remove these files from `C:\dev\noteTicketing`:
```
- app/ (entire directory - API routes)
- pages/ (entire directory - API frontend)
- migrations/ (entire directory - API database)
- types/ai-openai.d.ts
- ai-openai.d.ts
```

### Update `package.json` in main project:
Remove these dependencies:
```json
{
  "@neondatabase/serverless": "^0.10.4",
  "ai": "^4.3.18",
  "next": "^14.2.4",
  "openai": "^4.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

Remove these devDependencies:
```json
{
  "@types/react": "^18.2.0"
}
```

## Step 4: Update Discord Bot to Call External API

### Modify `C:\dev\noteTicketing\index.js`:

1. **Add API configuration**:
```javascript
const API_BASE_URL = process.env.API_BASE_URL || 'https://your-api-domain.vercel.app';
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;
```

2. **Update the summarize function** to call external API:
```javascript
async function summarizeChat(chatLog) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/summarize`, 
      { chatLog },
      { 
        headers: { 
          'Authorization': `Bearer ${API_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('API call failed:', error.response?.data || error.message);
    throw error;
  }
}
```

3. **Add environment variable** to Discord bot's `.env`:
```
API_BASE_URL=https://your-api-domain.vercel.app
API_AUTH_TOKEN=your-strong-secret-token
```

## Step 5: Final Project Structure

### Discord Bot Project (`C:\dev\noteTicketing`):
```
noteTicketing/
├── index.js (Discord bot)
├── package.json (Discord dependencies only)
├── .env (Discord + API config)
├── .gitignore
├── send_discord_message_node.json
├── debug_node.json
├── render.yaml
└── README.md
```

### API Project (`C:\dev\noteTicketing-api`):
```
noteTicketing-api/
├── app/
│   └── api/
│       └── summarize/
│           └── route.ts
├── pages/
│   └── index.tsx
├── migrations/
│   └── 001_create_api_rate_limits.sql
├── types/
│   └── ai-openai.d.ts
├── package.json (API dependencies)
├── tsconfig.json
├── next-env.d.ts
├── .env.local (API environment variables)
├── vercel.json
├── .gitignore
├── .cursorrules
├── ai-openai.d.ts
└── README.md
```

## Step 6: Deployment Steps

### API Project Deployment:
1. Push API project to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Discord Bot Updates:
1. Update environment variables with API URL
2. Test API integration
3. Deploy Discord bot (Render/Heroku/etc.)

## Step 7: Testing

### Test API Independently:
```bash
# In API project directory
npm run dev
curl -X POST http://localhost:3000/api/summarize \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"chatLog": "user1: Hello\nuser2: Hi there"}'
```

### Test Discord Bot Integration:
1. Start Discord bot
2. Use `/summarize` command
3. Verify API call works

## Notes
- Keep API authentication token secure
- Update documentation for both projects
- Consider API versioning for future updates
- Monitor API usage and rate limits 