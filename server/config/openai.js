import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OpenAI API key');
  console.error('Please set OPENAI_API_KEY in your .env file');
  throw new Error('Missing OpenAI API key. Please set OPENAI_API_KEY in your environment variables.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test OpenAI connection
export const testOpenAIConnection = async () => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test connection' }],
      max_tokens: 5
    });
    
    if (response.choices && response.choices.length > 0) {
      console.log('✅ OpenAI connection successful');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message);
    return false;
  }
};