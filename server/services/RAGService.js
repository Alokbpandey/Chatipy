import { supabase } from '../config/database.js';
import AIService from './AIService.js';

class RAGService {
  constructor() {
    this.aiService = new AIService();
    this.similarityThreshold = 0.7;
    this.maxContextLength = 4000;
  }

  async storeKnowledgeBase(chatbotId, scrapedData, qaData) {
    console.log(`📚 Storing knowledge base for chatbot ${chatbotId}...`);

    try {
      // Store scraped pages with embeddings
      console.log(`Storing ${scrapedData.pages.length} pages...`);
      for (let i = 0; i < scrapedData.pages.length; i++) {
        const page = scrapedData.pages[i];
        console.log(`Processing page ${i + 1}/${scrapedData.pages.length}: ${page.url}`);

        try {
          // Generate embedding for page content
          const pageText = `${page.title} ${page.description} ${page.textContent.substring(0, 2000)}`;
          const pageEmbedding = await this.aiService.generateEmbeddings(pageText);

          const { error: pageError } = await supabase
            .from('chatbot_pages')
            .insert({
              chatbot_id: chatbotId,
              url: page.url,
              title: page.title || '',
              description: page.description || '',
              content: page.textContent || '',
              headings: page.headings || [],
              nav_links: page.navLinks || [],
              word_count: page.wordCount || 0,
              embedding: pageEmbedding,
              scraped_at: page.scrapedAt
            });

          if (pageError) {
            console.error('Error storing page:', pageError);
          }

          // Add delay to avoid overwhelming the API
          if (i < scrapedData.pages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error processing page ${page.url}:`, error.message);
          continue;
        }
      }

      // Store Q&A pairs with embeddings
      console.log(`Storing ${qaData.length} Q&A pairs...`);
      for (let i = 0; i < qaData.length; i++) {
        const qa = qaData[i];
        console.log(`Processing Q&A ${i + 1}/${qaData.length}`);

        try {
          // Generate embedding for Q&A
          const qaText = `${qa.question} ${qa.answer}`;
          const qaEmbedding = await this.aiService.generateEmbeddings(qaText);

          const { error: qaError } = await supabase
            .from('chatbot_qa')
            .insert({
              chatbot_id: chatbotId,
              question: qa.question || '',
              answer: qa.answer || '',
              category: qa.category || 'general',
              keywords: qa.keywords || [],
              confidence: qa.confidence || 0.8,
              source_pages: qa.sourcePages || [],
              embedding: qaEmbedding,
              generated_at: qa.generatedAt
            });

          if (qaError) {
            console.error('Error storing Q&A:', qaError);
          }

          // Add delay to avoid overwhelming the API
          if (i < qaData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error processing Q&A:`, error.message);
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

      // Search for similar Q&A pairs using the RPC function
      const { data: qaResults, error: qaError } = await supabase.rpc(
        'search_similar_qa',
        {
          chatbot_id: chatbotId,
          query_embedding: queryEmbedding,
          similarity_threshold: this.similarityThreshold,
          match_limit: limit
        }
      );

      if (qaError) {
        console.error('Error searching Q&A:', qaError);
      }

      // Search for similar pages using the RPC function
      const { data: pageResults, error: pageError } = await supabase.rpc(
        'search_similar_pages',
        {
          chatbot_id: chatbotId,
          query_embedding: queryEmbedding,
          similarity_threshold: this.similarityThreshold,
          match_limit: limit
        }
      );

      if (pageError) {
        console.error('Error searching pages:', pageError);
      }

      return {
        qaResults: qaResults || [],
        pageResults: pageResults || []
      };

    } catch (error) {
      console.error('Error in similarity search:', error.message);
      return { qaResults: [], pageResults: [] };
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
      
      // Prioritize Q&A pairs as they are more direct answers
      if (searchResults.qaResults.length > 0) {
        context += 'Relevant Q&A:\n';
        searchResults.qaResults.forEach((qa, index) => {
          context += `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer}\n\n`;
        });
      }

      // Add relevant page content if needed
      if (searchResults.pageResults.length > 0 && context.length < 2000) {
        context += 'Additional Information:\n';
        searchResults.pageResults.forEach((page, index) => {
          const pageContent = page.content.substring(0, 500);
          context += `Page ${index + 1} (${page.title}): ${pageContent}...\n\n`;
        });
      }

      // Limit context length
      if (context.length > this.maxContextLength) {
        context = context.substring(0, this.maxContextLength) + '...';
      }

      // If no relevant context found, provide a helpful fallback
      if (!context.trim()) {
        context = `I don't have specific information about "${userQuery}" in my knowledge base. You may want to contact ${chatbot.website_name} directly for more detailed information.`;
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
      
      // Return a fallback response
      return {
        response: "I'm sorry, I'm having trouble processing your question right now. Please try rephrasing your question or contact us directly for assistance.",
        confidence: 0.1,
        sources: []
      };
    }
  }

  calculateConfidence(searchResults) {
    const { qaResults, pageResults } = searchResults;
    
    if (qaResults.length === 0 && pageResults.length === 0) {
      return 0.1;
    }

    // Q&A results are more reliable
    if (qaResults.length > 0) {
      const avgQAConfidence = qaResults.reduce((sum, qa) => sum + (qa.similarity || 0), 0) / qaResults.length;
      return Math.min(avgQAConfidence, 0.95); // Cap at 95%
    }

    // Page results are less reliable
    if (pageResults.length > 0) {
      const avgPageConfidence = pageResults.reduce((sum, page) => sum + (page.similarity || 0), 0) / pageResults.length;
      return Math.min(avgPageConfidence * 0.8, 0.85); // Reduce confidence and cap at 85%
    }

    return 0.1;
  }

  extractSources(searchResults) {
    const sources = new Set();
    
    // Add sources from Q&A results
    searchResults.qaResults.forEach(qa => {
      if (qa.source_pages && Array.isArray(qa.source_pages)) {
        qa.source_pages.forEach(url => sources.add(url));
      }
    });

    // Add sources from page results
    searchResults.pageResults.forEach(page => {
      if (page.url) {
        sources.add(page.url);
      }
    });

    return Array.from(sources).slice(0, 5); // Limit to 5 sources
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
      // Don't throw error as this is not critical
    }
  }

  async getChatbotAnalytics(chatbotId, timeframe = '7d') {
    try {
      const timeframeDate = this.getTimeframeDate(timeframe);
      
      const { data, error } = await supabase
        .from('chatbot_interactions')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .gte('created_at', timeframeDate)
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
      averageConfidence: stats.totalConfidence / stats.count
    }));
  }
}

export default RAGService;