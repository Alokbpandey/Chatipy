import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import WebScrapingService from '../services/WebScrapingService.js';
import AIService from '../services/AIService.js';
import RAGService from '../services/RAGService.js';
import { validateUrl, validateBotType, sanitizeInput } from '../utils/validation.js';

const router = express.Router();
const scrapingService = new WebScrapingService();
const aiService = new AIService();
const ragService = new RAGService();

// Store active processing jobs
const activeJobs = new Map();

// Start website scraping and chatbot generation
router.post('/generate-chatbot', async (req, res) => {
  try {
    const {
      websiteUrl,
      botType = 'general',
      botName,
      description,
      maxPages = 20,
      includeSubdomains = false
    } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        error: 'Website URL is required'
      });
    }

    // Validate URL
    const urlValidation = validateUrl(websiteUrl);
    if (!urlValidation.valid) {
      return res.status(400).json({
        error: urlValidation.error
      });
    }

    // Validate bot type
    if (!validateBotType(botType)) {
      return res.status(400).json({
        error: 'Invalid bot type'
      });
    }

    const chatbotId = uuidv4();
    const sanitizedBotName = sanitizeInput(botName) || new URL(websiteUrl).hostname;
    const sanitizedDescription = sanitizeInput(description) || `AI chatbot for ${new URL(websiteUrl).hostname}`;
    
    // Create chatbot record
    const { error: chatbotError } = await supabase
      .from('chatbots')
      .insert({
        id: chatbotId,
        website_url: urlValidation.url,
        website_name: sanitizedBotName,
        bot_type: botType,
        description: sanitizedDescription,
        status: 'processing',
        progress: 0,
        created_at: new Date().toISOString()
      });

    if (chatbotError) {
      throw new Error(`Failed to create chatbot record: ${chatbotError.message}`);
    }

    // Start async processing
    const jobPromise = processWebsiteAsync(chatbotId, urlValidation.url, {
      botType,
      maxPages: Math.min(maxPages, 50), // Limit to 50 pages max
      includeSubdomains
    });

    // Store job reference
    activeJobs.set(chatbotId, jobPromise);

    // Clean up completed jobs
    jobPromise.finally(() => {
      activeJobs.delete(chatbotId);
    });

    res.json({
      success: true,
      chatbotId,
      message: 'Chatbot generation started',
      estimatedTime: '2-5 minutes'
    });

  } catch (error) {
    console.error('Error starting chatbot generation:', error.message);
    res.status(500).json({
      error: 'Failed to start chatbot generation',
      message: error.message
    });
  }
});

// Get chatbot generation status
router.get('/status/:chatbotId', async (req, res) => {
  try {
    const { chatbotId } = req.params;

    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();

    if (error || !chatbot) {
      return res.status(404).json({
        error: 'Chatbot not found'
      });
    }

    // Get additional stats
    const [qaResult, pageResult] = await Promise.all([
      supabase.from('chatbot_qa').select('id').eq('chatbot_id', chatbotId),
      supabase.from('chatbot_pages').select('id').eq('chatbot_id', chatbotId)
    ]);

    res.json({
      ...chatbot,
      stats: {
        totalQAs: qaResult.data?.length || 0,
        totalPages: pageResult.data?.length || 0
      },
      isProcessing: activeJobs.has(chatbotId)
    });

  } catch (error) {
    console.error('Error getting chatbot status:', error.message);
    res.status(500).json({
      error: 'Failed to get chatbot status',
      message: error.message
    });
  }
});

// Get all chatbots
router.get('/chatbots', async (req, res) => {
  try {
    const { data: chatbots, error } = await supabase
      .from('chatbots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({
      chatbots: chatbots || []
    });

  } catch (error) {
    console.error('Error getting chatbots:', error.message);
    res.status(500).json({
      error: 'Failed to get chatbots',
      message: error.message
    });
  }
});

// Delete chatbot and all associated data
router.delete('/chatbot/:chatbotId', async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Cancel active job if exists
    if (activeJobs.has(chatbotId)) {
      activeJobs.delete(chatbotId);
    }

    // Delete in correct order due to foreign key constraints
    await Promise.all([
      supabase.from('chatbot_interactions').delete().eq('chatbot_id', chatbotId),
      supabase.from('chatbot_qa').delete().eq('chatbot_id', chatbotId),
      supabase.from('chatbot_pages').delete().eq('chatbot_id', chatbotId)
    ]);
    
    const { error } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', chatbotId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Chatbot deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chatbot:', error.message);
    res.status(500).json({
      error: 'Failed to delete chatbot',
      message: error.message
    });
  }
});

// Async processing function
async function processWebsiteAsync(chatbotId, websiteUrl, options) {
  try {
    console.log(`🚀 Starting async processing for chatbot ${chatbotId}`);

    // Update status to scraping
    await updateChatbotStatus(chatbotId, {
      status: 'scraping',
      progress: 10
    });

    // Scrape website
    console.log(`🔍 Scraping website: ${websiteUrl}`);
    const scrapedData = await scrapingService.scrapeWebsite(websiteUrl, {
      maxPages: options.maxPages,
      includeSubdomains: options.includeSubdomains
    });

    if (!scrapedData.pages || scrapedData.pages.length === 0) {
      throw new Error('No content could be extracted from the website');
    }

    // Update status to generating Q&A
    await updateChatbotStatus(chatbotId, {
      status: 'generating_qa',
      progress: 40,
      pages_scraped: scrapedData.pages.length
    });

    // Generate Q&A pairs
    console.log(`🤖 Generating Q&A pairs for ${scrapedData.pages.length} pages`);
    const qaData = await aiService.generateQuestionsAndAnswers(scrapedData, options.botType);

    if (!qaData || qaData.length === 0) {
      throw new Error('Failed to generate Q&A pairs from website content');
    }

    // Update status to storing data
    await updateChatbotStatus(chatbotId, {
      status: 'storing_data',
      progress: 70,
      qa_pairs_generated: qaData.length
    });

    // Store knowledge base
    console.log(`📚 Storing knowledge base: ${qaData.length} Q&A pairs`);
    await ragService.storeKnowledgeBase(chatbotId, scrapedData, qaData);

    // Update status to finalizing
    await updateChatbotStatus(chatbotId, {
      status: 'finalizing',
      progress: 90
    });

    // Generate website summary
    console.log(`📝 Generating website summary`);
    const summary = await aiService.summarizeWebsite(scrapedData);

    // Update status to completed
    await updateChatbotStatus(chatbotId, {
      status: 'completed',
      progress: 100,
      summary: summary,
      completed_at: new Date().toISOString()
    });

    console.log(`✅ Chatbot ${chatbotId} generation completed successfully`);

  } catch (error) {
    console.error(`❌ Error processing chatbot ${chatbotId}:`, error.message);

    // Update status to failed
    await updateChatbotStatus(chatbotId, {
      status: 'failed',
      error_message: error.message
    });
  }
}

async function updateChatbotStatus(chatbotId, updates) {
  try {
    updates.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('chatbots')
      .update(updates)
      .eq('id', chatbotId);

    if (error) {
      console.error('Error updating chatbot status:', error);
    }
  } catch (error) {
    console.error('Error updating chatbot status:', error.message);
  }
}

export default router;