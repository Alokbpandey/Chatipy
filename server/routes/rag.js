import express from 'express';
import RAGService from '../services/RAGService.js';

const router = express.Router();
const ragService = new RAGService();

// Search similar content
router.post('/search', async (req, res) => {
  try {
    const { chatbotId, query, limit = 5 } = req.body;

    if (!chatbotId || !query) {
      return res.status(400).json({
        error: 'Chatbot ID and query are required'
      });
    }

    const results = await ragService.searchSimilarContent(chatbotId, query, limit);

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error in RAG search:', error.message);
    res.status(500).json({
      error: 'Failed to search content',
      message: error.message
    });
  }
});

// Get chatbot analytics
router.get('/analytics/:chatbotId', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { timeframe = '7d' } = req.query;

    const analytics = await ragService.getChatbotAnalytics(chatbotId, timeframe);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error getting analytics:', error.message);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

// Test RAG system with sample query
router.post('/test/:chatbotId', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { query = 'What is this website about?' } = req.body;

    const result = await ragService.generateContextualResponse(chatbotId, query);

    res.json({
      success: true,
      testQuery: query,
      ...result
    });

  } catch (error) {
    console.error('Error testing RAG:', error.message);
    res.status(500).json({
      error: 'Failed to test RAG system',
      message: error.message
    });
  }
});

export default router;