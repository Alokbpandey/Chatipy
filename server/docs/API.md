# Chatify Backend API Documentation

## Overview

The Chatify backend provides a complete solution for website scraping, AI-powered Q&A generation, and RAG (Retrieval Augmented Generation) chatbot functionality.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API is open for demo purposes. In production, implement proper authentication.

## Endpoints

### Health Check

```http
GET /health
```

Returns server status and basic information.

### Scraping & Chatbot Generation

#### Generate Chatbot

```http
POST /api/scraping/generate-chatbot
```

**Body:**
```json
{
  "websiteUrl": "https://example.com",
  "botType": "navigation|qa|whatsapp|support|general",
  "botName": "My Website Bot",
  "description": "AI assistant for my website",
  "maxPages": 20,
  "includeSubdomains": false
}
```

**Response:**
```json
{
  "success": true,
  "chatbotId": "uuid",
  "message": "Chatbot generation started",
  "estimatedTime": "2-5 minutes"
}
```

#### Get Generation Status

```http
GET /api/scraping/status/:chatbotId
```

**Response:**
```json
{
  "id": "uuid",
  "status": "processing|completed|failed",
  "progress": 75,
  "pages_scraped": 15,
  "qa_pairs_generated": 45,
  "stats": {
    "totalQAs": 45,
    "totalPages": 15
  }
}
```

#### Get All Chatbots

```http
GET /api/scraping/chatbots
```

#### Delete Chatbot

```http
DELETE /api/scraping/chatbot/:chatbotId
```

### Chatbot Interaction

#### Chat with Chatbot

```http
POST /api/chatbot/:chatbotId/chat
```

**Body:**
```json
{
  "message": "What services do you offer?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "response": "We offer web development, mobile apps, and AI solutions...",
  "confidence": 0.92,
  "sources": ["https://example.com/services", "https://example.com/about"],
  "chatbotInfo": {
    "name": "Example Website Bot",
    "type": "qa"
  }
}
```

#### Get Chatbot Details

```http
GET /api/chatbot/:chatbotId
```

#### Update Chatbot

```http
PUT /api/chatbot/:chatbotId
```

#### Get Q&A Pairs

```http
GET /api/chatbot/:chatbotId/qa?category=general&limit=50
```

#### Get Scraped Pages

```http
GET /api/chatbot/:chatbotId/pages?limit=50
```

### RAG (Retrieval Augmented Generation)

#### Search Similar Content

```http
POST /api/rag/search
```

**Body:**
```json
{
  "chatbotId": "uuid",
  "query": "pricing information",
  "limit": 5
}
```

#### Get Analytics

```http
GET /api/rag/analytics/:chatbotId?timeframe=7d
```

#### Test RAG System

```http
POST /api/rag/test/:chatbotId
```

### Analytics

#### Platform Analytics

```http
GET /api/analytics/platform
```

#### Usage Statistics

```http
GET /api/analytics/usage?timeframe=30d
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Returns 429 status code when exceeded

## Environment Variables

Required environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
NODE_ENV=development
```

## Setup Instructions

1. Copy `.env.example` to `.env`
2. Fill in your API keys and configuration
3. Run `node server/scripts/setup.js` to verify setup
4. Start the server with `npm run server`

## Integration Examples

### Frontend Integration

```javascript
// Generate a new chatbot
const response = await fetch('/api/scraping/generate-chatbot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    websiteUrl: 'https://example.com',
    botType: 'qa',
    botName: 'My Bot'
  })
});

const { chatbotId } = await response.json();

// Chat with the bot
const chatResponse = await fetch(`/api/chatbot/${chatbotId}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What services do you offer?'
  })
});

const { response: botResponse } = await chatResponse.json();
```

### WhatsApp Integration

```javascript
// Example webhook handler for WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  const { message, from } = req.body;
  
  const chatResponse = await fetch(`/api/chatbot/${chatbotId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  
  const { response } = await chatResponse.json();
  
  // Send response back to WhatsApp
  // Implementation depends on WhatsApp Business API
});
```