# Chatify - AI Chatbot Generator Platform

Transform any website into an intelligent chatbot in minutes. Powered by advanced AI and machine learning.

## 🚀 Features

- **Instant Generation**: Create production-ready chatbots from any website URL
- **Multiple Bot Types**: Navigation, Q&A, WhatsApp, Support, and General purpose bots
- **AI-Powered**: Uses GPT-4 and vector embeddings for intelligent responses
- **Multi-Platform**: Deploy to WhatsApp, Telegram, Discord, or embed on websites
- **Developer Friendly**: REST APIs, NPM packages, and comprehensive documentation
- **Enterprise Security**: Bank-grade encryption and GDPR compliance

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for development and building
- Lucide React for icons

### Backend
- Node.js with Express
- Supabase for database and vector storage
- OpenAI GPT-4 for AI responses
- Puppeteer/Cheerio for web scraping
- Rate limiting and security middleware

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your API keys:
   - `OPENAI_API_KEY`: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Get from [Supabase Dashboard](https://supabase.com/dashboard)

4. **Set up the database**
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/` in your Supabase SQL editor
   - This creates all necessary tables and functions

5. **Verify setup**
   ```bash
   npm run setup
   ```

## 🚀 Development

1. **Start the backend server**
   ```bash
   npm run server
   ```

2. **Start the frontend (in another terminal)**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

## 📚 API Documentation

### Generate Chatbot
```http
POST /api/scraping/generate-chatbot
Content-Type: application/json

{
  "websiteUrl": "https://example.com",
  "botType": "qa",
  "botName": "My Website Bot",
  "description": "AI assistant for my website",
  "maxPages": 20
}
```

### Chat with Chatbot
```http
POST /api/chatbot/:chatbotId/chat
Content-Type: application/json

{
  "message": "What services do you offer?"
}
```

### Get Generation Status
```http
GET /api/scraping/status/:chatbotId
```

See `server/docs/API.md` for complete API documentation.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI responses | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `MAX_PAGES_PER_SITE` | Max pages to scrape (default: 50) | No |
| `SCRAPING_TIMEOUT` | Scraping timeout in ms (default: 30000) | No |

### Bot Types

- **Navigation**: Helps users navigate and find information on websites
- **Q&A**: Comprehensive question-answering based on website content
- **WhatsApp**: Optimized for WhatsApp Business messaging
- **Support**: Customer support and troubleshooting focused
- **General**: Balanced mix of all capabilities

## 🚀 Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Configure production CORS origins
3. Set up proper SSL certificates
4. Use a process manager like PM2
5. Set up monitoring and logging

### Frontend Deployment
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Configure environment variables for production API endpoints

## 🔒 Security

- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Private URL blocking
- SQL injection protection via Supabase

## 🧪 Testing

Run the setup script to verify all connections:
```bash
npm run setup
```

Test individual components:
- Database: Check Supabase dashboard
- OpenAI: Verify API key in OpenAI platform
- Scraping: Test with a simple website URL

## 📈 Monitoring

- Health check endpoint: `/health`
- Analytics endpoints: `/api/analytics/*`
- Error logging in console and database
- Rate limiting metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the API documentation in `server/docs/API.md`
- Run `npm run setup` to diagnose configuration issues
- Ensure all environment variables are properly set
- Check server logs for detailed error messages

## 🔮 Roadmap

- [ ] Voice chatbot support
- [ ] Custom AI model training
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Enterprise SSO integration
- [ ] White-label solutions