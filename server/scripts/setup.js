import { testConnection } from '../config/database.js';
import { testOpenAIConnection } from '../config/openai.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

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
    console.log('\n🔗 Get your keys from:');
    console.log('   - OpenAI: https://platform.openai.com/api-keys');
    console.log('   - Supabase: https://supabase.com/dashboard');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set\n');

  // Test database connection
  console.log('🗄️ Testing database connection...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed. Please check your Supabase configuration.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify SUPABASE_URL is correct');
    console.log('   2. Verify SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('   3. Ensure your Supabase project is active');
    console.log('   4. Check if the database schema is properly set up');
    process.exit(1);
  }

  // Test OpenAI connection
  console.log('🤖 Testing OpenAI connection...');
  const aiConnected = await testOpenAIConnection();
  if (!aiConnected) {
    console.error('❌ OpenAI connection failed. Please check your API key.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify OPENAI_API_KEY is correct');
    console.log('   2. Ensure your OpenAI account has sufficient credits');
    console.log('   3. Check if the API key has the required permissions');
    process.exit(1);
  }

  console.log('\n🎉 Backend setup completed successfully!');
  console.log('🚀 You can now start the server with: npm run server');
  console.log('📚 API Documentation available at: http://localhost:3001/health');
  console.log('🔗 Frontend should connect to: http://localhost:3001/api');
}

setupBackend().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});