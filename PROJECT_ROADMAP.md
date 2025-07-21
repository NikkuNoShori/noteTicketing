# NoteTicketing Discord Bot - Project Roadmap

## 🎯 **Project Overview**
A privacy-focused Discord bot that integrates with AI APIs to provide chat summarization, automatic action item detection, and scheduled channel sweeping. Built as a modular API-first service that can be licensed independently, with separate frontend solutions as additional revenue streams.

---

## 📊 **Current Status**

### ✅ **Completed Features**
- [x] Discord bot with slash commands (`/summarize`, `/config`)
- [x] n8n workflow integration for AI processing
- [x] Basic sweep functionality (hourly trigger)
- [x] Privacy mode configuration
- [x] Channel monitoring configuration
- [x] Enhanced sweep configuration (enable/disable, intervals, output channels)
- [x] Database schema planning (4 tables identified)

### 🔄 **In Progress**
- [ ] Database migration for sweep output channels
- [ ] API endpoint analysis and documentation
- [ ] Frontend GUI planning

### 📋 **Planned Features**
- [ ] To-do item storage and management
- [ ] Comprehensive REST API for external frontends
- [ ] Advanced sweep controls
- [ ] User permission management
- [ ] Analytics and reporting
- [ ] API authentication and rate limiting
- [ ] Multi-tenant support for licensing

---

## 🔌 **Current API Endpoints Analysis**

### **Existing Endpoints (Based on Bot Code)**
Based on the Discord bot code analysis, these endpoints are referenced:

#### **Bot Configuration API**
- `GET /api/bot-config?guildId={guildId}` - Retrieve guild configuration
- `PATCH /api/bot-config` - Update guild configuration
  - Supports: `privacyModeEnabled`, `channelsToMonitor`, `todoChannelId`, `sweepIntervalHours`, `active`, `sweepOutputChannelId`

#### **Sweep Processing API**
- `POST /api/sweep-channels` - Process channel messages for action items
  - Input: `guildId`, `channelId`, `messages`, `sweepType`

#### **Webhook Integration**
- `POST /webhook/discord-ai-ingest` - n8n webhook for AI processing
  - Input: `channel_id`, `user_id`, `hours`, `messages`

### **Missing API Endpoints (For Frontend GUI)**

#### **Action Items Management**
- `GET /api/action-items?guildId={guildId}` - List action items
- `POST /api/action-items` - Create new action item
- `PUT /api/action-items/{id}` - Update action item
- `DELETE /api/action-items/{id}` - Delete action item
- `PATCH /api/action-items/{id}/status` - Update item status

#### **Guild Management**
- `GET /api/guilds` - List all guilds bot is in
- `GET /api/guilds/{guildId}/channels` - List guild channels
- `GET /api/guilds/{guildId}/stats` - Guild usage statistics

#### **Sweep Management**
- `GET /api/sweep/history?guildId={guildId}` - Sweep execution history
- `POST /api/sweep/trigger` - Manually trigger sweep
- `GET /api/sweep/status?guildId={guildId}` - Current sweep status

#### **User Management**
- `GET /api/users/{userId}/permissions` - Check user permissions
- `POST /api/users/{userId}/permissions` - Grant permissions

#### **Analytics & Reporting**
- `GET /api/analytics/summary?guildId={guildId}&period={period}` - Usage analytics
- `GET /api/analytics/action-items?guildId={guildId}` - Action item statistics

---

## 🔌 **API-First Architecture**

### **Core API Requirements**
1. **Guild Management**
   - Multi-guild support
   - Guild status and statistics
   - Quick enable/disable per guild

2. **Channel Configuration**
   - Channel discovery and management
   - Add/remove monitored channels
   - Set output channels for different features

3. **Sweep Management**
   - Enable/disable sweep per guild
   - Set sweep intervals (1-24 hours)
   - Configure output channels
   - View sweep history and results

4. **Action Items Management**
   - CRUD operations for action items
   - Filter by channel, priority, status
   - Mark items as complete
   - Bulk operations

5. **Privacy & Security**
   - Privacy mode toggle
   - Audit log access
   - Data export/import

6. **User Management**
   - Permission management
   - Role-based access control
   - User activity tracking

### **API Technical Requirements**
- **Authentication**: API key or JWT token system
- **Rate Limiting**: Per-client and per-guild limits
- **CORS Support**: For web frontend integration
- **WebSocket Support**: Real-time updates (optional)
- **Documentation**: OpenAPI/Swagger specs
- **Versioning**: API version management

---

## 🗄️ **Database Schema**

### **Current Tables Identified**
1. **`action_items`** - Store extracted to-do items
2. **`bot_config`** - Guild configuration settings
3. **`privacy_audit`** - GDPR compliance logging
4. **`processed_messages`** - Prevent duplicate processing

### **Schema Updates Needed**
- [ ] Add `sweep_output_channel_id` to `bot_config`
- [ ] Add `active` boolean to `bot_config`
- [ ] Define `action_items` table structure
- [ ] Define `privacy_audit` table structure
- [ ] Define `processed_messages` table structure

---

## 🚀 **Implementation Priority**

### **Phase 1: Foundation (Current)**
- [x] Enhanced bot configuration
- [x] Database migrations
- [x] API endpoint documentation
- [x] Core API server implementation
- [x] Guild management endpoints
- [x] Action items CRUD endpoints
- [x] Sweep management endpoints
- [x] Analytics endpoints

### **Phase 2: Core Features**
- [ ] Action items storage system
- [ ] Sweep result processing
- [ ] Basic API endpoints

### **Phase 3: API Development**
- [ ] Complete REST API endpoints
- [ ] Authentication and rate limiting
- [ ] API documentation and testing

### **Phase 4: Licensing & Multi-tenancy**
- [ ] Multi-tenant support
- [ ] License management system
- [ ] Analytics and reporting
- [ ] Advanced sweep controls
- [ ] User permission system

---

## 📝 **Next Steps**

### **Immediate (This Week)**
1. ✅ **Run database migration** for sweep output channels
2. ✅ **Create comprehensive API endpoint documentation** with examples
3. ✅ **Design API authentication system** for external frontends
4. ✅ **Set up CORS and rate limiting** for API access
5. **Install new dependencies** and test API server
6. **Run database schema migration** for new tables
7. **Test API endpoints** with sample data

### **Short Term (Next 2 Weeks)**
1. **Implement missing API endpoints** (action items, guilds, sweep management)
2. **Create action items storage system** with full CRUD operations
3. **Build API testing suite** and documentation
4. **Test end-to-end API workflow**

### **Medium Term (Next Month)**
1. **Complete API implementation** with all endpoints
2. **Add analytics and reporting APIs**
3. **Implement multi-tenant licensing system**
4. **API performance optimization and monitoring**

---

## 🔧 **Technical Debt & Improvements**

### **Bot Code**
- [ ] Add proper error handling for API failures
- [ ] Implement rate limiting for commands
- [ ] Add logging for debugging
- [ ] Create health check endpoints

### **n8n Workflow**
- [ ] Fix database connection issues (red-bordered nodes)
- [ ] Add error handling and retry logic
- [ ] Optimize workflow performance
- [ ] Add workflow monitoring

### **Security**
- [ ] Implement proper API authentication (API keys/JWT)
- [ ] Add request validation and sanitization
- [ ] Set up CORS for external frontend integration
- [ ] Add rate limiting per client and per guild
- [ ] Implement API key management system

---

## 📞 **Questions & Decisions Needed**

1. **API Authentication**: API keys vs JWT tokens vs OAuth2?
2. **Rate Limiting Strategy**: Per-client, per-guild, or hybrid?
3. **Database**: Additional indexes or optimizations needed?
4. **Deployment**: Where to host the API service?
5. **Real-time**: WebSocket vs polling for updates?
6. **Licensing Model**: Per-guild, per-user, or usage-based?
7. **API Versioning**: URL versioning vs header versioning?

---

## 💰 **Revenue Stream Strategy**

### **Primary Revenue: Bot Licensing**
- **Per-Guild Licensing**: Charge per Discord server
- **Feature Tiers**: Basic, Pro, Enterprise
- **Usage-Based**: API calls, message processing volume
- **White-Label**: Reseller opportunities

### **Secondary Revenue: Frontend Solutions**
- **Web Dashboard**: Premium web interface
- **Mobile App**: iOS/Android companion app
- **Desktop App**: Electron-based desktop client
- **Custom Integrations**: Slack, Teams, etc.

### **API Monetization**
- **API Access**: Charge for API usage
- **Webhook Limits**: Tiered webhook processing
- **Real-time Features**: Premium real-time updates
- **Analytics**: Advanced reporting and insights

---

## 🏗️ **Modular Architecture Benefits**

### **Independent Bot Service**
- ✅ Can be licensed and deployed independently
- ✅ No frontend dependencies
- ✅ API-first design enables multiple frontends
- ✅ Easier to maintain and scale

### **Separate Frontend Projects**
- ✅ Multiple revenue streams
- ✅ Different target markets
- ✅ Independent development cycles
- ✅ Technology flexibility (React, Vue, mobile, etc.)

### **API Gateway Pattern**
- ✅ Centralized authentication and rate limiting
- ✅ Consistent API across all frontends
- ✅ Easy to add new frontend clients
- ✅ Analytics and monitoring in one place

---

*Last Updated: January 2024*
*Next Review: Weekly* 