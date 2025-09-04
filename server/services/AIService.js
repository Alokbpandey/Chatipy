import { openai } from '../config/openai.js';

class AIService {
  constructor() {
    this.model = 'gpt-3.5-turbo';
    this.embeddingModel = 'text-embedding-ada-002';
    this.maxTokens = 4000;
  }

  async generateQuestionsAndAnswers(scrapedData, botType = 'general') {
    const { pages } = scrapedData;
    
    if (!pages || pages.length === 0) {
      throw new Error('No scraped data provided for Q&A generation');
    }

    console.log(`🤖 Generating Q&A for ${pages.length} pages...`);

    const allQAs = [];

    // Process pages in batches to avoid token limits
    const batchSize = 2;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      
      try {
        const batchQAs = await this.processBatch(batch, botType);
        allQAs.push(...batchQAs);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < pages.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, error.message);
        continue;
      }
    }

    console.log(`✅ Generated ${allQAs.length} Q&A pairs`);
    return allQAs;
  }

  async processBatch(pages, botType) {
    const combinedContent = pages.map(page => {
      const content = page.textContent.substring(0, 1500);
      return `URL: ${page.url}\nTitle: ${page.title}\nDescription: ${page.description}\nContent: ${content}`;
    }).join('\n\n---\n\n');

    const systemPrompt = this.getSystemPrompt(botType);
    const userPrompt = `Based on the following website content, generate comprehensive question-answer pairs that would be useful for a ${botType} chatbot. Focus on the most important information users would want to know.

Website Content:
${combinedContent}

Generate 6-10 diverse Q&A pairs in JSON format with this exact structure:
{
  "qa_pairs": [
    {
      "question": "What is...",
      "answer": "Detailed answer based on the content...",
      "category": "general",
      "keywords": ["keyword1", "keyword2"],
      "confidence": 0.95
    }
  ]
}

Make sure the JSON is valid and answers are based only on the provided content.`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      
      // Clean up the response to ensure valid JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      if (!parsedResponse.qa_pairs || !Array.isArray(parsedResponse.qa_pairs)) {
        throw new Error('Invalid response format');
      }
      
      return parsedResponse.qa_pairs.map(qa => ({
        question: qa.question || '',
        answer: qa.answer || '',
        category: qa.category || 'general',
        keywords: Array.isArray(qa.keywords) ? qa.keywords : [],
        confidence: typeof qa.confidence === 'number' ? qa.confidence : 0.8,
        sourcePages: pages.map(p => p.url),
        generatedAt: new Date().toISOString()
      })).filter(qa => qa.question && qa.answer);

    } catch (error) {
      console.error('Error generating Q&A:', error.message);
      return [];
    }
  }

  getSystemPrompt(botType) {
    const prompts = {
      navigation: `You are an expert at creating navigation-focused chatbots. Generate questions and answers that help users find information, navigate the website, and understand the site structure. Focus on "Where can I find...", "How do I access...", "What pages are available..." type questions.`,
      
      qa: `You are an expert at creating comprehensive Q&A chatbots. Generate diverse questions covering all aspects of the website content including services, products, company information, policies, and general inquiries. Make answers detailed and helpful.`,
      
      whatsapp: `You are an expert at creating WhatsApp business chatbots. Generate questions and answers suitable for mobile messaging, with concise but complete answers. Focus on customer service, product inquiries, and business information.`,
      
      support: `You are an expert at creating customer support chatbots. Generate questions about common issues, troubleshooting, policies, contact information, and problem resolution. Make answers solution-oriented and helpful.`,
      
      general: `You are an expert at creating general-purpose chatbots. Generate a balanced mix of questions covering navigation, information, services, and support topics.`
    };

    return prompts[botType] || prompts.general;
  }

  async generateEmbeddings(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Empty text provided for embedding');
      }

      // Clean and limit text
      const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 8000);

      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: cleanText
      });

      if (!response.data || !response.data[0] || !response.data[0].embedding) {
        throw new Error('Invalid embedding response');
      }

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error.message);
      throw error;
    }
  }

  async generateChatbotResponse(query, context, chatbotConfig) {
    const systemPrompt = `You are a helpful chatbot for the website "${chatbotConfig.websiteName}". 
    
    Bot Type: ${chatbotConfig.botType}
    Website Description: ${chatbotConfig.description}
    
    Use the provided context to answer user questions accurately and helpfully. If the context doesn't contain relevant information, politely say you don't have that information and suggest contacting the website directly.
    
    Keep responses concise but informative. Match the tone and style appropriate for the bot type.
    
    Always be helpful, professional, and accurate.`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context: ${context}\n\nUser Question: ${query}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating chatbot response:', error.message);
      throw error;
    }
  }

  async summarizeWebsite(scrapedData) {
    const { pages } = scrapedData;
    
    if (!pages || pages.length === 0) {
      return 'No content available for summary';
    }

    const combinedContent = pages
      .slice(0, 3) // Use first 3 pages for summary
      .map(page => `${page.title}: ${page.textContent.substring(0, 800)}`)
      .join('\n\n');

    const prompt = `Analyze the following website content and provide a comprehensive summary including:
    1. What the website is about
    2. Main services or products offered
    3. Key features and benefits
    4. Target audience

    Website Content:
    ${combinedContent}

    Provide a structured summary in 2-3 paragraphs.`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.5
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating website summary:', error.message);
      return 'Unable to generate website summary';
    }
  }
}

export default AIService;