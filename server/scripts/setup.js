import { testConnection } from '../config/database.js';
import { testOpenAIConnection } from '../config/openai.js';
import dotenv from 'dotenv';

dotenv.config();

async function setupBackend() {
  console.log('🚀 Setting up Chatify Backend...\n');

  // Check environment variables
  console.log('📋 Checking environment variables...');
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log('\n📝 Please copy .env.example to .env and fill in the required values.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set\n');

  // Test database connection
  console.log('🗄️ Testing database connection...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed. Please check your Supabase configuration.');
    process.exit(1);
  }

  // Test OpenAI connection
  console.log('🤖 Testing OpenAI connection...');
  const aiConnected = await testOpenAIConnection();
  if (!aiConnected) {
    console.error('❌ OpenAI connection failed. Please check your API key.');
    process.exit(1);
  }

  console.log('\n🎉 Backend setup completed successfully!');
  console.log('🚀 You can now start the server with: npm run server');
  console.log('📚 API Documentation: http://localhost:3001/health');
}

setupBackend().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});