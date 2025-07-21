# NoteTicketing Bot API Specification

## 🎯 **Overview**
This document specifies the REST API for the NoteTicketing Discord bot service. The API is designed to be consumed by external frontend applications, mobile apps, and other integrations.

**Base URL**: `https://api.noteticketing.com/v1`  
**Authentication**: API Key (Bearer token)  
**Content-Type**: `application/json`

---

## 🔐 **Authentication**

### **API Key Authentication**
All requests require an API key in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

### **Rate Limiting**
- **Standard**: 1000 requests per hour per API key
- **Premium**: 10,000 requests per hour per API key
- **Enterprise**: 100,000 requests per hour per API key

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## 📋 **Endpoints**

### **Guild Management**

#### **List Guilds**
```http
GET /guilds
```

**Response:**
```json
{
  "guilds": [
    {
      "id": "123456789",
      "name": "My Discord Server",
      "icon": "https://cdn.discordapp.com/icons/123456789/abc123.png",
      "member_count": 150,
      "bot_permissions": ["SendMessages", "ReadMessageHistory"],
      "active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### **Get Guild Details**
```http
GET /guilds/{guildId}
```

#### **Get Guild Channels**
```http
GET /guilds/{guildId}/channels
```

**Response:**
```json
{
  "channels": [
    {
      "id": "987654321",
      "name": "general",
      "type": "text",
      "position": 0,
      "monitored": true,
      "output_channel": false
    }
  ]
}
```

#### **Get Guild Statistics**
```http
GET /guilds/{guildId}/stats?period=7d
```

**Query Parameters:**
- `period`: 1d, 7d, 30d, 90d

---

### **Bot Configuration**

#### **Get Guild Configuration**
```http
GET /guilds/{guildId}/config
```

**Response:**
```json
{
  "guild_id": "123456789",
  "active": true,
  "privacy_mode_enabled": false,
  "channels_to_monitor": ["987654321", "111222333"],
  "todo_channel_id": "444555666",
  "sweep_output_channel_id": "777888999",
  "sweep_interval_hours": 6,
  "last_sweep_time": "2024-01-15T10:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### **Update Guild Configuration**
```http
PATCH /guilds/{guildId}/config
```

**Request Body:**
```json
{
  "active": true,
  "privacy_mode_enabled": false,
  "channels_to_monitor": ["987654321"],
  "todo_channel_id": "444555666",
  "sweep_output_channel_id": "777888999",
  "sweep_interval_hours": 4
}
```

#### **Add Channel to Monitor**
```http
POST /guilds/{guildId}/channels/monitor
```

**Request Body:**
```json
{
  "channel_id": "987654321"
}
```

#### **Remove Channel from Monitor**
```http
DELETE /guilds/{guildId}/channels/monitor/{channelId}
```

---

### **Action Items Management**

#### **List Action Items**
```http
GET /guilds/{guildId}/action-items
```

**Query Parameters:**
- `status`: pending, completed, archived
- `priority`: low, medium, high
- `channel_id`: Filter by source channel
- `limit`: Number of items (default: 50, max: 100)
- `offset`: Pagination offset
- `sort`: created_at, priority, updated_at
- `order`: asc, desc

**Response:**
```json
{
  "action_items": [
    {
      "id": "abc123def456",
      "guild_id": "123456789",
      "channel_id": "987654321",
      "channel_name": "general",
      "summary": "Meeting follow-up tasks",
      "text": "Schedule follow-up meeting with team",
      "priority": "high",
      "category": "meeting",
      "status": "pending",
      "assigned_to": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

#### **Get Action Item**
```http
GET /guilds/{guildId}/action-items/{itemId}
```

#### **Create Action Item**
```http
POST /guilds/{guildId}/action-items
```

**Request Body:**
```json
{
  "channel_id": "987654321",
  "summary": "Meeting follow-up tasks",
  "text": "Schedule follow-up meeting with team",
  "priority": "high",
  "category": "meeting",
  "assigned_to": "user123"
}
```

#### **Update Action Item**
```http
PUT /guilds/{guildId}/action-items/{itemId}
```

**Request Body:**
```json
{
  "text": "Schedule follow-up meeting with team - UPDATED",
  "priority": "medium",
  "status": "in_progress",
  "assigned_to": "user456"
}
```

#### **Delete Action Item**
```http
DELETE /guilds/{guildId}/action-items/{itemId}
```

#### **Update Action Item Status**
```http
PATCH /guilds/{guildId}/action-items/{itemId}/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

---

### **Sweep Management**

#### **Get Sweep Status**
```http
GET /guilds/{guildId}/sweep/status
```

**Response:**
```json
{
  "guild_id": "123456789",
  "active": true,
  "interval_hours": 6,
  "last_sweep_time": "2024-01-15T10:00:00Z",
  "next_sweep_time": "2024-01-15T16:00:00Z",
  "output_channel_id": "777888999",
  "monitored_channels": 3,
  "total_action_items": 25
}
```

#### **Trigger Manual Sweep**
```http
POST /guilds/{guildId}/sweep/trigger
```

**Request Body:**
```json
{
  "channel_ids": ["987654321", "111222333"],
  "force": false
}
```

#### **Get Sweep History**
```http
GET /guilds/{guildId}/sweep/history
```

**Query Parameters:**
- `limit`: Number of records (default: 20, max: 100)
- `offset`: Pagination offset

**Response:**
```json
{
  "sweeps": [
    {
      "id": "sweep123",
      "guild_id": "123456789",
      "triggered_at": "2024-01-15T10:00:00Z",
      "channels_processed": 3,
      "messages_processed": 150,
      "action_items_found": 5,
      "status": "completed",
      "duration_seconds": 45
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

---

### **Analytics & Reporting**

#### **Get Guild Analytics**
```http
GET /guilds/{guildId}/analytics?period=30d
```

**Query Parameters:**
- `period`: 1d, 7d, 30d, 90d

**Response:**
```json
{
  "guild_id": "123456789",
  "period": "30d",
  "summary": {
    "total_messages_processed": 15000,
    "total_action_items": 250,
    "sweeps_executed": 120,
    "channels_monitored": 5
  },
  "trends": {
    "action_items_per_day": [5, 8, 3, 12, 7],
    "messages_processed_per_day": [500, 450, 600, 550, 480]
  },
  "top_channels": [
    {
      "channel_id": "987654321",
      "channel_name": "general",
      "action_items": 85,
      "messages_processed": 5000
    }
  ]
}
```

#### **Get Action Items Analytics**
```http
GET /guilds/{guildId}/analytics/action-items?period=30d
```

**Response:**
```json
{
  "guild_id": "123456789",
  "period": "30d",
  "by_priority": {
    "high": 50,
    "medium": 120,
    "low": 80
  },
  "by_category": {
    "meeting": 75,
    "project": 100,
    "general": 75
  },
  "by_status": {
    "pending": 180,
    "in_progress": 45,
    "completed": 25
  },
  "completion_rate": 0.17
}
```

---

### **User Management**

#### **Get User Permissions**
```http
GET /guilds/{guildId}/users/{userId}/permissions
```

**Response:**
```json
{
  "user_id": "user123",
  "guild_id": "123456789",
  "permissions": {
    "can_configure_bot": true,
    "can_manage_action_items": true,
    "can_view_analytics": true,
    "can_trigger_sweeps": false
  },
  "roles": ["admin", "moderator"]
}
```

#### **Update User Permissions**
```http
PUT /guilds/{guildId}/users/{userId}/permissions
```

**Request Body:**
```json
{
  "permissions": {
    "can_configure_bot": true,
    "can_manage_action_items": true,
    "can_view_analytics": false,
    "can_trigger_sweeps": true
  }
}
```

---

### **Privacy & Audit**

#### **Get Privacy Audit Log**
```http
GET /guilds/{guildId}/privacy/audit
```

**Query Parameters:**
- `action`: data_access, data_deletion, privacy_toggle
- `limit`: Number of records
- `offset`: Pagination offset

**Response:**
```json
{
  "audit_logs": [
    {
      "id": "audit123",
      "guild_id": "123456789",
      "action": "data_access",
      "user_id": "user123",
      "details": "API access to action items",
      "timestamp": "2024-01-15T10:30:00Z",
      "ip_address": "192.168.1.1"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### **Export Guild Data**
```http
GET /guilds/{guildId}/export
```

**Query Parameters:**
- `format`: json, csv
- `include_audit`: true, false

---

## 🚨 **Error Responses**

### **Standard Error Format**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "channel_id",
      "issue": "Channel not found"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123def456"
  }
}
```

### **Common Error Codes**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 📝 **Webhooks**

### **Action Item Created Webhook**
```http
POST /webhooks/action-item-created
```

**Headers:**
```http
X-Webhook-Signature: sha256=abc123...
Content-Type: application/json
```

**Payload:**
```json
{
  "event": "action_item.created",
  "guild_id": "123456789",
  "action_item": {
    "id": "abc123def456",
    "text": "Schedule follow-up meeting",
    "priority": "high",
    "channel_name": "general"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔧 **SDK Examples**

### **JavaScript/Node.js**
```javascript
const NoteTicketingAPI = require('@noteticketing/api');

const api = new NoteTicketingAPI({
  apiKey: 'your_api_key_here',
  baseURL: 'https://api.noteticketing.com/v1'
});

// Get guild configuration
const config = await api.guilds.getConfig('123456789');

// Create action item
const actionItem = await api.actionItems.create('123456789', {
  channel_id: '987654321',
  text: 'Follow up on project proposal',
  priority: 'high'
});
```

### **Python**
```python
import noteticketing

api = noteticketing.Client(api_key='your_api_key_here')

# List action items
action_items = api.action_items.list(guild_id='123456789', status='pending')

# Update configuration
api.guilds.update_config('123456789', {
    'sweep_interval_hours': 4,
    'active': True
})
```

---

*Last Updated: January 2024*  
*Version: 1.0.0* 