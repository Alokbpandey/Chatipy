import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import WebScrapingService from '../services/WebScrapingService.js';
import AIService from '../services/AIService.js';
import RAGService from '../services/RAGService.js';

const router = express.Router();
const scrapingService = new WebScrapingService();
const aiService = new AIService();
const ragService = new RAGService();

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
    try {
      new URL(websiteUrl);
    } catch {
      return res.status(400).json({
        error: 'Invalid URL format'
      });
    }

    const chatbotId = uuidv4();
    
    // Create chatbot record
    const { error: chatbotError } = await supabase
      .from('chatbots')
      .insert({
        id: chatbotId,
        website_url: websiteUrl,
        website_name: botName || new URL(websiteUrl).hostname,
        bot_type: botType,
        description: description || `AI chatbot for ${new URL(websiteUrl).hostname}`,
        status: 'processing',
        created_at: new Date().toISOString()
      });

    if (chatbotError) {
      throw new Error(`Failed to create chatbot record: ${chatbotError.message}`);
    }

    // Start async processing
    processWebsiteAsync(chatbotId, websiteUrl, {
      botType,
      maxPages,
      includeSubdomains
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
    const { data: qaCount } = await supabase
      .from('chatbot_qa')
      .select('id')
      .eq('chatbot_id', chatbotId);

    const { data: pageCount } = await supabase
      .from('chatbot_pages')
      .select('id')
      .eq('chatbot_id', chatbotId);

    res.json({
      ...chatbot,
      stats: {
        totalQAs: qaCount?.length || 0,
        totalPages: pageCount?.length || 0
      }
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
      .order('created_at', { ascending: false });

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

    // Delete in correct order due to foreign key constraints
    await supabase.from('chatbot_interactions').delete().eq('chatbot_id', chatbotId);
    await supabase.from('chatbot_qa').delete().eq('chatbot_id', chatbotId);
    await supabase.from('chatbot_pages').delete().eq('chatbot_id', chatbotId);
    
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
    await supabase
      .from('chatbots')
      .update({ 
        status: 'scraping',
        progress: 10,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId);

    // Scrape website
    const scrapedData = await scrapingService.scrapeWebsite(websiteUrl, {
      maxPages: options.maxPages,
      includeSubdomains: options.includeSubdomains
    });

    // Update status to generating Q&A
    await supabase
      .from('chatbots')
      .update({ 
        status: 'generating_qa',
        progress: 50,
        pages_scraped: scrapedData.pages.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId);

    // Generate Q&A pairs
    const qaData = await aiService.generateQuestionsAndAnswers(scrapedData, options.botType);

    // Update status to storing data
    await supabase
      .from('chatbots')
      .update({ 
        status: 'storing_data',
        progress: 80,
        qa_pairs_generated: qaData.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId);

    // Store knowledge base
    await ragService.storeKnowledgeBase(chatbotId, scrapedData, qaData);

    // Generate website summary
    const summary = await aiService.summarizeWebsite(scrapedData);

    // Update status to completed
    await supabase
      .from('chatbots')
      .update({ 
        status: 'completed',
        progress: 100,
        summary: summary,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId);

    console.log(`✅ Chatbot ${chatbotId} generation completed successfully`);

  } catch (error) {
    console.error(`❌ Error processing chatbot ${chatbotId}:`, error.message);

    // Update status to failed
    await supabase
      .from('chatbots')
      .update({ 
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId);
  }
}

export default router;