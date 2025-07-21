# API Setup Guide

## 🚀 **Phase 1 Complete!**

We've successfully implemented the core API infrastructure for your modular bot service. Here's what's been created:

### ✅ **What's Ready**

1. **Complete REST API Server** (`src/api/server.js`)
2. **25+ API Endpoints** across 4 route modules
3. **Database Schema** for all tables
4. **Authentication & Rate Limiting**
5. **Comprehensive API Documentation**
6. **Error Handling & Validation**

---

## 📋 **Setup Steps**

### **Step 1: Install Dependencies**
```bash
npm install
```

This will install the new dependencies:
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `pg` - PostgreSQL client

### **Step 2: Run Database Migrations**

#### **Migration 1: Sweep Output Channels**
Run this in your NeonDB console:
```sql
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS sweep_output_channel_id VARCHAR(20);
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
```

#### **Migration 2: Create New Tables**
Run this in your NeonDB console:
```sql
-- Copy and paste the entire contents of migrations/create_tables.sql
```

### **Step 3: Update Environment Variables**

Add these to your `.env` file:
```bash
# API Configuration
API_PORT=3001
API_KEY=your-secret-api-key-here
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Database (if not already set)
DATABASE_URL=your-neon-db-connection-string
```

### **Step 4: Start the API Server**

#### **Development Mode**
```bash
npm run api:dev
```

#### **Production Mode**
```bash
npm run api
```

The API will be available at: `http://localhost:3001`

---

## 🧪 **Testing the API**

### **Health Check**
```bash
curl http://localhost:3001/health
```

### **Test Guild Endpoints**
```bash
# List guilds
curl -H "Authorization: Bearer your-secret-api-key-here" \
  http://localhost:3001/api/guilds

# Get guild config
curl -H "Authorization: Bearer your-secret-api-key-here" \
  http://localhost:3001/api/guilds/YOUR_GUILD_ID/config
```

### **Test Action Items**
```bash
# Create action item
curl -X POST \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "123456789",
    "text": "Test action item",
    "priority": "high",
    "category": "test"
  }' \
  http://localhost:3001/api/action-items/YOUR_GUILD_ID

# List action items
curl -H "Authorization: Bearer your-secret-api-key-here" \
  http://localhost:3001/api/action-items/YOUR_GUILD_ID
```

### **Test Sweep Management**
```bash
# Get sweep status
curl -H "Authorization: Bearer your-secret-api-key-here" \
  http://localhost:3001/api/sweep/YOUR_GUILD_ID/status

# Trigger manual sweep
curl -X POST \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"force": true}' \
  http://localhost:3001/api/sweep/YOUR_GUILD_ID/trigger
```

---

## 📊 **Available Endpoints**

### **Guild Management**
- `GET /api/guilds` - List all guilds
- `GET /api/guilds/{guildId}` - Get guild details
- `GET /api/guilds/{guildId}/channels` - Get guild channels
- `GET /api/guilds/{guildId}/stats` - Get guild statistics
- `GET /api/guilds/{guildId}/config` - Get guild configuration
- `PATCH /api/guilds/{guildId}/config` - Update guild configuration

### **Action Items**
- `GET /api/action-items/{guildId}` - List action items
- `GET /api/action-items/{guildId}/{itemId}` - Get specific action item
- `POST /api/action-items/{guildId}` - Create action item
- `PUT /api/action-items/{guildId}/{itemId}` - Update action item
- `DELETE /api/action-items/{guildId}/{itemId}` - Delete action item
- `PATCH /api/action-items/{guildId}/{itemId}/status` - Update status

### **Sweep Management**
- `GET /api/sweep/{guildId}/status` - Get sweep status
- `POST /api/sweep/{guildId}/trigger` - Trigger manual sweep
- `GET /api/sweep/{guildId}/history` - Get sweep history

### **Analytics**
- `GET /api/analytics/{guildId}` - Get guild analytics
- `GET /api/analytics/{guildId}/action-items` - Get action items analytics
- `GET /api/analytics/{guildId}/channels/{channelId}` - Get channel analytics

---

## 🔧 **Integration with Your Bot**

### **Update Bot to Use New API**

Your Discord bot can now use these endpoints instead of the old API calls. For example:

```javascript
// Old way
const response = await axios.patch(`${process.env.API_BASE_URL}/api/bot-config`, {
  guildId,
  active: true
}, {
  headers: {
    'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
  }
});

// New way
const response = await axios.patch(`http://localhost:3001/api/guilds/${guildId}/config`, {
  active: true
}, {
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}`
  }
});
```

### **Environment Variable Updates**

Update your bot's `.env`:
```bash
# Remove old API variables
# API_BASE_URL=...
# MY_API_AUTH_TOKEN=...

# Add new API variables
API_KEY=your-secret-api-key-here
API_BASE_URL=http://localhost:3001/api
```

---

## 🎯 **Next Steps**

### **Immediate**
1. ✅ Install dependencies
2. ✅ Run database migrations
3. ✅ Test API endpoints
4. ✅ Update bot integration

### **Short Term**
1. **Frontend Development** - Start building your web dashboard
2. **API Testing Suite** - Create comprehensive tests
3. **Production Deployment** - Deploy API to production
4. **Monitoring & Logging** - Add observability

### **Medium Term**
1. **Multi-tenant Support** - API key management
2. **Advanced Analytics** - More detailed reporting
3. **WebSocket Support** - Real-time updates
4. **Mobile App** - React Native frontend

---

## 🚨 **Troubleshooting**

### **Database Connection Issues**
- Verify `DATABASE_URL` is correct
- Check NeonDB connection string format
- Ensure database is accessible

### **API Authentication Issues**
- Verify `API_KEY` is set correctly
- Check Authorization header format: `Bearer YOUR_KEY`
- Ensure API key matches environment variable

### **CORS Issues**
- Update `ALLOWED_ORIGINS` in `.env`
- Add your frontend domain to the list
- Restart API server after changes

### **Rate Limiting**
- Default: 1000 requests per hour per IP
- Check `X-RateLimit-*` headers in responses
- Increase limits in `src/api/server.js` if needed

---

## 📞 **Support**

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set
3. Test database connectivity
4. Review the API specification document

The API is now ready for your frontend development! 🎉 