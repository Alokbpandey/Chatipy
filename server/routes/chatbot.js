import express from 'express';
import { supabase } from '../config/database.js';
import RAGService from '../services/RAGService.js';

const router = express.Router();
const ragService = new RAGService();

// Chat with a specific chatbot
router.post('/:chatbotId/chat', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Check if chatbot exists and is ready
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      return res.status(404).json({
        error: 'Chatbot not found'
      });
    }

    if (chatbot.status !== 'completed') {
      return res.status(400).json({
        error: 'Chatbot is not ready yet',
        status: chatbot.status,
        progress: chatbot.progress
      });
    }

    // Generate response using RAG
    const result = await ragService.generateContextualResponse(chatbotId, message);

    res.json({
      success: true,
      response: result.response,
      confidence: result.confidence,
      sources: result.sources,
      chatbotInfo: {
        name: chatbot.website_name,
        type: chatbot.bot_type
      }
    });

  } catch (error) {
    console.error('Error in chat:', error.message);
    res.status(500).json({
      error: 'Failed to generate response',
      message: error.message
    });
  }
});

// Get chatbot details
router.get('/:chatbotId', async (req, res) => {
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

    res.json(chatbot);

  } catch (error) {
    console.error('Error getting chatbot:', error.message);
    res.status(500).json({
      error: 'Failed to get chatbot',
      message: error.message
    });
  }
});

// Update chatbot configuration
router.put('/:chatbotId', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.status;
    delete updates.progress;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('chatbots')
      .update(updates)
      .eq('id', chatbotId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      chatbot: data
    });

  } catch (error) {
    console.error('Error updating chatbot:', error.message);
    res.status(500).json({
      error: 'Failed to update chatbot',
      message: error.message
    });
  }
});

// Get chatbot's Q&A pairs
router.get('/:chatbotId/qa', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { category, limit = 50 } = req.query;

    let query = supabase
      .from('chatbot_qa')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('confidence', { ascending: false })
      .limit(parseInt(limit));

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      qaPairs: data || []
    });

  } catch (error) {
    console.error('Error getting Q&A pairs:', error.message);
    res.status(500).json({
      error: 'Failed to get Q&A pairs',
      message: error.message
    });
  }
});

// Get chatbot's scraped pages
router.get('/:chatbotId/pages', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('chatbot_pages')
      .select('url, title, description, word_count, scraped_at')
      .eq('chatbot_id', chatbotId)
      .order('scraped_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      pages: data || []
    });

  } catch (error) {
    console.error('Error getting pages:', error.message);
    res.status(500).json({
      error: 'Failed to get pages',
      message: error.message
    });
  }
});

export default router;