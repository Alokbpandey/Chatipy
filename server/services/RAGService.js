import { supabase } from '../config/database.js';
import AIService from './AIService.js';

class RAGService {
  constructor() {
    this.aiService = new AIService();
    this.similarityThreshold = 0.7;
    this.maxContextLength = 3000;
  }

  async storeKnowledgeBase(chatbotId, scrapedData, qaData) {
    console.log(`📚 Storing knowledge base for chatbot ${chatbotId}...`);

    try {
      // Store scraped pages with embeddings
      for (const page of scrapedData.pages) {
        try {
          const pageEmbedding = await this.aiService.generateEmbeddings(
            `${page.title} ${page.description} ${page.textContent.substring(0, 2000)}`
          );

          const { error: pageError } = await supabase
            .from('chatbot_pages')
            .insert({
              chatbot_id: chatbotId,
              url: page.url,
              title: page.title,
              description: page.description,
              content: page.textContent,
              headings: page.headings || [],
              nav_links: page.navLinks || [],
              word_count: page.wordCount,
              embedding: pageEmbedding,
              scraped_at: page.scrapedAt
            });

          if (pageError) {
            console.error('Error storing page:', pageError);
          }
        } catch (embeddingError) {
          console.error(`Error processing page ${page.url}:`, embeddingError.message);
          continue;
        }
      }

      // Store Q&A pairs with embeddings
      for (const qa of qaData) {
        try {
          const qaEmbedding = await this.aiService.generateEmbeddings(
            `${qa.question} ${qa.answer}`
          );

          const { error: qaError } = await supabase
            .from('chatbot_qa')
            .insert({
              chatbot_id: chatbotId,
              question: qa.question,
              answer: qa.answer,
              category: qa.category,
              keywords: qa.keywords || [],
              confidence: qa.confidence,
              source_pages: qa.sourcePages || [],
              embedding: qaEmbedding,
              generated_at: qa.generatedAt
            });

          if (qaError) {
            console.error('Error storing Q&A:', qaError);
          }
        } catch (embeddingError) {
          console.error(`Error processing Q&A:`, embeddingError.message);
          continue;
        }
      }

      console.log('✅ Knowledge base stored successfully');
      return true;

    } catch (error) {
      console.error('❌ Error storing knowledge base:', error.message);
      throw error;
    }
  }

  async searchSimilarContent(chatbotId, query, limit = 5) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.aiService.generateEmbeddings(query);

      // Search for similar Q&A pairs using cosine similarity
      const { data: qaResults, error: qaError } = await supabase
        .from('chatbot_qa')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .limit(limit);

      if (qaError) {
        console.error('Error searching Q&A:', qaError);
      }

      // Search for similar pages
      const { data: pageResults, error: pageError } = await supabase
        .from('chatbot_pages')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .limit(limit);

      if (pageError) {
        console.error('Error searching pages:', pageError);
      }

      // Calculate similarities manually (fallback for vector search)
      const qaWithSimilarity = (qaResults || []).map(qa => ({
        ...qa,
        similarity: this.calculateSimilarity(queryEmbedding, qa.embedding)
      })).filter(qa => qa.similarity > this.similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity);

      const pagesWithSimilarity = (pageResults || []).map(page => ({
        ...page,
        similarity: this.calculateSimilarity(queryEmbedding, page.embedding)
      })).filter(page => page.similarity > this.similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity);

      return {
        qaResults: qaWithSimilarity.slice(0, limit),
        pageResults: pagesWithSimilarity.slice(0, limit)
      };

    } catch (error) {
      console.error('Error in similarity search:', error.message);
      return { qaResults: [], pageResults: [] };
    }
  }

  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || !Array.isArray(embedding1) || !Array.isArray(embedding2)) {
      return 0;
    }

    try {
      // Cosine similarity calculation
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < Math.min(embedding1.length, embedding2.length); i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }

      const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
      return magnitude > 0 ? dotProduct / magnitude : 0;
    } catch (error) {
      console.error('Error calculating similarity:', error.message);
      return 0;
    }
  }

  async generateContextualResponse(chatbotId, userQuery) {
    try {
      // Get chatbot configuration
      const { data: chatbot, error: chatbotError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single();

      if (chatbotError || !chatbot) {
        throw new Error('Chatbot not found');
      }

      // Search for relevant content
      const searchResults = await this.searchSimilarContent(chatbotId, userQuery, 3);
      
      // Build context from search results
      let context = '';
      
      // Add relevant Q&A pairs
      if (searchResults.qaResults.length > 0) {
        context += 'Relevant Information:\n';
        searchResults.qaResults.forEach(qa => {
          context += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
        });
      }

      // Add relevant page content
      if (searchResults.pageResults.length > 0) {
        context += 'Website Content:\n';
        searchResults.pageResults.forEach(page => {
          context += `Page: ${page.title}\nContent: ${page.content.substring(0, 400)}...\n\n`;
        });
      }

      // Fallback context if no similar content found
      if (!context.trim()) {
        const { data: fallbackQA } = await supabase
          .from('chatbot_qa')
          .select('question, answer')
          .eq('chatbot_id', chatbotId)
          .limit(3);

        if (fallbackQA && fallbackQA.length > 0) {
          context = 'General Information:\n';
          fallbackQA.forEach(qa => {
            context += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
          });
        }
      }

      // Limit context length
      if (context.length > this.maxContextLength) {
        context = context.substring(0, this.maxContextLength) + '...';
      }

      // Generate response using AI
      const response = await this.aiService.generateChatbotResponse(
        userQuery,
        context,
        {
          websiteName: chatbot.website_name,
          botType: chatbot.bot_type,
          description: chatbot.description
        }
      );

      // Log the interaction
      await this.logInteraction(chatbotId, userQuery, response, searchResults);

      return {
        response,
        confidence: this.calculateConfidence(searchResults),
        sources: this.extractSources(searchResults)
      };

    } catch (error) {
      console.error('Error generating contextual response:', error.message);
      throw error;
    }
  }

  calculateConfidence(searchResults) {
    const { qaResults, pageResults } = searchResults;
    
    if (qaResults.length === 0 && pageResults.length === 0) {
      return 0.3;
    }

    const avgQAConfidence = qaResults.length > 0 
      ? qaResults.reduce((sum, qa) => sum + (qa.similarity || 0), 0) / qaResults.length
      : 0;

    const avgPageConfidence = pageResults.length > 0
      ? pageResults.reduce((sum, page) => sum + (page.similarity || 0), 0) / pageResults.length
      : 0;

    return Math.max(avgQAConfidence, avgPageConfidence, 0.3);
  }

  extractSources(searchResults) {
    const sources = new Set();
    
    searchResults.qaResults.forEach(qa => {
      if (qa.source_pages && Array.isArray(qa.source_pages)) {
        qa.source_pages.forEach(url => sources.add(url));
      }
    });

    searchResults.pageResults.forEach(page => {
      sources.add(page.url);
    });

    return Array.from(sources);
  }

  async logInteraction(chatbotId, query, response, searchResults) {
    try {
      await supabase
        .from('chatbot_interactions')
        .insert({
          chatbot_id: chatbotId,
          user_query: query,
          bot_response: response,
          confidence: this.calculateConfidence(searchResults),
          sources: this.extractSources(searchResults),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging interaction:', error.message);
    }
  }

  async getChatbotAnalytics(chatbotId, timeframe = '7d') {
    try {
      const { data, error } = await supabase
        .from('chatbot_interactions')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .gte('created_at', this.getTimeframeDate(timeframe))
        .order('created_at', { ascending: false });

      if (error) throw error;

      const analytics = {
        totalInteractions: data.length,
        averageConfidence: data.length > 0 
          ? data.reduce((sum, interaction) => sum + (interaction.confidence || 0), 0) / data.length
          : 0,
        topQueries: this.getTopQueries(data),
        dailyStats: this.getDailyStats(data),
        lowConfidenceQueries: data.filter(interaction => (interaction.confidence || 0) < 0.5)
      };

      return analytics;

    } catch (error) {
      console.error('Error getting analytics:', error.message);
      throw error;
    }
  }

  getTimeframeDate(timeframe) {
    const now = new Date();
    const days = parseInt(timeframe.replace('d', ''));
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000)).toISOString();
  }

  getTopQueries(interactions) {
    const queryCount = {};
    interactions.forEach(interaction => {
      const query = interaction.user_query.toLowerCase();
      queryCount[query] = (queryCount[query] || 0) + 1;
    });

    return Object.entries(queryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  getDailyStats(interactions) {
    const dailyStats = {};
    interactions.forEach(interaction => {
      const date = interaction.created_at.split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { count: 0, totalConfidence: 0 };
      }
      dailyStats[date].count++;
      dailyStats[date].totalConfidence += (interaction.confidence || 0);
    });

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      interactions: stats.count,
      averageConfidence: stats.count > 0 ? stats.totalConfidence / stats.count : 0
    }));
  }
}

export default RAGService;