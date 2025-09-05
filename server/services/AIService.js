import { openai } from '../config/openai.js';

class AIService {
  constructor() {
    this.model = 'gpt-3.5-turbo';
    this.embeddingModel = 'text-embedding-ada-002';
    this.maxTokens = 2000;
    this.temperature = 0.7;
  }

  async generateQuestionsAndAnswers(scrapedData, botType = 'general') {
    const { pages } = scrapedData;
    
    if (!pages || pages.length === 0) {
      throw new Error('No scraped data provided for Q&A generation');
    }

    console.log(`🤖 Generating Q&A for ${pages.length} pages with bot type: ${botType}`);

    const allQAs = [];

    // Process pages in batches to avoid token limits
    const batchSize = 2; // Reduced batch size for better processing
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pages.length/batchSize)}`);
      
      try {
        const batchQAs = await this.processBatch(batch, botType);
        allQAs.push(...batchQAs);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < pages.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`Error processing batch ${i}-${i+batchSize}:`, error.message);
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    // Generate additional general Q&As based on overall website content
    try {
      const generalQAs = await this.generateGeneralQAs(pages, botType);
      allQAs.push(...generalQAs);
    } catch (error) {
      console.error('Error generating general Q&As:', error.message);
    }

    console.log(`✅ Generated ${allQAs.length} Q&A pairs total`);
    return allQAs;
  }

  async processBatch(pages, botType) {
    const combinedContent = pages.map(page => {
      // Limit content length to avoid token limits
      const content = page.textContent.substring(0, 1500);
      return `URL: ${page.url}\nTitle: ${page.title}\nDescription: ${page.description}\nContent: ${content}`;
    }).join('\n\n---PAGE_SEPARATOR---\n\n');

    const systemPrompt = this.getSystemPrompt(botType);
    const userPrompt = `Based on the following website content, generate comprehensive question-answer pairs that would be useful for a ${botType} chatbot.

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

Make sure answers are informative and based on the actual content provided. Use appropriate categories like: general, navigation, product, service, support, about, contact.`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });

      const content = response.choices[0].message.content;
      
      // Clean up the response to ensure valid JSON
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        console.error('Raw content:', content);
        return [];
      }
      
      if (!parsedResponse.qa_pairs || !Array.isArray(parsedResponse.qa_pairs)) {
        console.error('Invalid response structure:', parsedResponse);
        return [];
      }
      
      return parsedResponse.qa_pairs.map(qa => ({
        ...qa,
        sourcePages: pages.map(p => p.url),
        generatedAt: new Date().toISOString(),
        confidence: qa.confidence || 0.8
      }));

    } catch (error) {
      console.error('Error generating Q&A batch:', error.message);
      return [];
    }
  }

  async generateGeneralQAs(pages, botType) {
    // Generate website overview Q&As
    const websiteOverview = pages.slice(0, 3).map(page => 
      `${page.title}: ${page.textContent.substring(0, 800)}`
    ).join('\n\n');

    const prompt = `Based on this website overview, generate 5 general questions and answers that users commonly ask about websites:

${websiteOverview}

Generate questions like:
- What is this website about?
- What services/products do you offer?
- How can I contact you?
- What makes you different?
- Who are you?

Return JSON format:
{
  "qa_pairs": [
    {
      "question": "What is this website about?",
      "answer": "Based on the content...",
      "category": "general",
      "keywords": ["about", "website", "overview"],
      "confidence": 0.9
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.6
      });

      const content = response.choices[0].message.content;
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsedResponse = JSON.parse(cleanedContent);
      
      return parsedResponse.qa_pairs.map(qa => ({
        ...qa,
        sourcePages: pages.slice(0, 3).map(p => p.url),
        generatedAt: new Date().toISOString(),
        confidence: qa.confidence || 0.85
      }));

    } catch (error) {
      console.error('Error generating general Q&As:', error.message);
      return [];
    }
  }

  getSystemPrompt(botType) {
    const prompts = {
      navigation: `You are an expert at creating navigation-focused chatbots. Generate questions and answers that help users find information, navigate the website, and understand the site structure. Focus on "Where can I find...", "How do I access...", "What pages are available..." type questions. Make answers clear and include specific navigation guidance.`,
      
      qa: `You are an expert at creating comprehensive Q&A chatbots. Generate diverse questions covering all aspects of the website content including services, products, company information, policies, and general inquiries. Make answers detailed, helpful, and based strictly on the provided content.`,
      
      whatsapp: `You are an expert at creating WhatsApp business chatbots. Generate questions and answers suitable for mobile messaging, with concise but complete answers. Focus on customer service, product inquiries, business information, and common customer questions. Keep answers conversational and mobile-friendly.`,
      
      support: `You are an expert at creating customer support chatbots. Generate questions about common issues, troubleshooting, policies, contact information, and problem resolution. Make answers solution-oriented, helpful, and actionable. Include relevant contact information when available.`,
      
      general: `You are an expert at creating general-purpose chatbots. Generate a balanced mix of questions covering navigation, information, services, and support topics. Make answers comprehensive and helpful for a wide range of user needs.`
    };

    return prompts[botType] || prompts.general;
  }

  async generateEmbeddings(text) {
    try {
      // Clean and limit text length
      const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 8000);
      
      if (!cleanText) {
        throw new Error('Empty text provided for embedding');
      }

      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: cleanText
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error.message);
      throw error;
    }
  }

  async generateChatbotResponse(query, context, chatbotConfig) {
    const systemPrompt = `You are a helpful chatbot for "${chatbotConfig.websiteName}".

Bot Type: ${chatbotConfig.botType}
Website: ${chatbotConfig.description}

Instructions:
- Use the provided context to answer user questions accurately and helpfully
- If the context doesn't contain relevant information, politely say you don't have that specific information
- Keep responses concise but informative (2-3 sentences max)
- Match the tone appropriate for the bot type
- Be friendly and professional
- If asked about contact information, provide it if available in the context

Context Information:
${context}`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
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

    // Use first 3 pages for summary to avoid token limits
    const combinedContent = pages
      .slice(0, 3)
      .map(page => `${page.title}: ${page.textContent.substring(0, 1000)}`)
      .join('\n\n');

    const prompt = `Analyze the following website content and provide a comprehensive summary including:

1. What the website is about (main purpose/business)
2. Key services or products offered
3. Target audience
4. Unique features or benefits
5. Contact information if available

Website Content:
${combinedContent}

Provide a structured summary in 2-3 paragraphs that would help someone understand what this website offers.`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.5
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating website summary:', error.message);
      return 'Unable to generate website summary due to processing error.';
    }
  }
}

export default AIService;