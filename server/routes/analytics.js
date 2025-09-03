import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

// Get platform-wide analytics
router.get('/platform', async (req, res) => {
  try {
    // Get total chatbots
    const { count: totalChatbots } = await supabase
      .from('chatbots')
      .select('*', { count: 'exact', head: true });

    // Get completed chatbots
    const { count: completedChatbots } = await supabase
      .from('chatbots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get total interactions
    const { count: totalInteractions } = await supabase
      .from('chatbot_interactions')
      .select('*', { count: 'exact', head: true });

    // Get recent activity
    const { data: recentChatbots } = await supabase
      .from('chatbots')
      .select('website_name, bot_type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get bot type distribution
    const { data: botTypes } = await supabase
      .from('chatbots')
      .select('bot_type')
      .eq('status', 'completed');

    const botTypeStats = {};
    botTypes?.forEach(bot => {
      botTypeStats[bot.bot_type] = (botTypeStats[bot.bot_type] || 0) + 1;
    });

    res.json({
      success: true,
      analytics: {
        totalChatbots: totalChatbots || 0,
        completedChatbots: completedChatbots || 0,
        totalInteractions: totalInteractions || 0,
        successRate: totalChatbots > 0 ? (completedChatbots / totalChatbots * 100).toFixed(1) : 0,
        recentActivity: recentChatbots || [],
        botTypeDistribution: botTypeStats
      }
    });

  } catch (error) {
    console.error('Error getting platform analytics:', error.message);
    res.status(500).json({
      error: 'Failed to get platform analytics',
      message: error.message
    });
  }
});

// Get usage statistics
router.get('/usage', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily chatbot creation stats
    const { data: dailyCreations } = await supabase
      .from('chatbots')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // Get daily interaction stats
    const { data: dailyInteractions } = await supabase
      .from('chatbot_interactions')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // Process daily stats
    const dailyStats = {};
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { chatbots: 0, interactions: 0 };
    }

    // Count chatbot creations
    dailyCreations?.forEach(chatbot => {
      const date = chatbot.created_at.split('T')[0];
      if (dailyStats[date]) {
        dailyStats[date].chatbots++;
      }
    });

    // Count interactions
    dailyInteractions?.forEach(interaction => {
      const date = interaction.created_at.split('T')[0];
      if (dailyStats[date]) {
        dailyStats[date].interactions++;
      }
    });

    const usageData = Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      timeframe,
      usageData
    });

  } catch (error) {
    console.error('Error getting usage statistics:', error.message);
    res.status(500).json({
      error: 'Failed to get usage statistics',
      message: error.message
    });
  }
});

export default router;