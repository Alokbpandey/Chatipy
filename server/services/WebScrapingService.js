import * as cheerio from 'cheerio';
import { URL } from 'url';

class WebScrapingService {
  constructor() {
    this.maxPagesPerSite = parseInt(process.env.MAX_PAGES_PER_SITE) || 50;
    this.timeout = parseInt(process.env.SCRAPING_TIMEOUT) || 30000;
    this.userAgent = process.env.USER_AGENT || 'Chatify-Bot/1.0.0';
  }

  async scrapeWebsite(baseUrl, options = {}) {
    const {
      maxPages = this.maxPagesPerSite,
      includeSubdomains = false,
      excludePatterns = ['/admin', '/login', '/api', '.pdf', '.jpg', '.png', '.gif', '.css', '.js']
    } = options;

    console.log(`🚀 Starting website scraping for: ${baseUrl}`);

    const scrapedData = {
      baseUrl,
      pages: [],
      metadata: {
        totalPages: 0,
        scrapedAt: new Date().toISOString(),
        errors: []
      }
    };

    try {
      // Discover all URLs from the website
      const urlsToScrape = await this.discoverUrls(baseUrl, {
        maxPages,
        includeSubdomains,
        excludePatterns
      });

      console.log(`📊 Found ${urlsToScrape.length} URLs to scrape`);

      // Scrape each URL
      for (let i = 0; i < Math.min(urlsToScrape.length, maxPages); i++) {
        const url = urlsToScrape[i];
        console.log(`🔍 Scraping ${i + 1}/${Math.min(urlsToScrape.length, maxPages)}: ${url}`);

        try {
          const pageData = await this.scrapePage(url);
          if (pageData && pageData.textContent.length > 100) {
            scrapedData.pages.push(pageData);
          }
        } catch (error) {
          console.error(`❌ Error scraping ${url}:`, error.message);
          scrapedData.metadata.errors.push({
            url,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      scrapedData.metadata.totalPages = scrapedData.pages.length;
      console.log(`✅ Scraping completed: ${scrapedData.pages.length} pages scraped`);

      if (scrapedData.pages.length === 0) {
        throw new Error('No content could be extracted from the website');
      }

      return scrapedData;

    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw new Error(`Website scraping failed: ${error.message}`);
    }
  }

  async discoverUrls(baseUrl, options) {
    const { maxPages, includeSubdomains, excludePatterns } = options;
    const discoveredUrls = new Set([baseUrl]);
    const urlsToProcess = [baseUrl];
    const processedUrls = new Set();

    const baseDomain = new URL(baseUrl).hostname;

    while (urlsToProcess.length > 0 && discoveredUrls.size < maxPages) {
      const currentUrl = urlsToProcess.shift();
      
      if (processedUrls.has(currentUrl)) continue;
      processedUrls.add(currentUrl);

      try {
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': this.userAgent
          },
          timeout: this.timeout
        });

        if (!response.ok) continue;

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract all links from the page
        const links = [];
        $('a[href]').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
            try {
              const absoluteUrl = new URL(href, currentUrl).toString();
              links.push(absoluteUrl);
            } catch {
              // Skip invalid URLs
            }
          }
        });

        for (const link of links) {
          try {
            const linkUrl = new URL(link);
            const linkDomain = linkUrl.hostname;

            // Check domain restrictions
            if (!includeSubdomains && linkDomain !== baseDomain) continue;
            if (includeSubdomains && !linkDomain.includes(baseDomain.split('.').slice(-2).join('.'))) continue;

            // Check exclude patterns
            if (excludePatterns.some(pattern => link.includes(pattern))) continue;

            // Normalize URL (remove fragments)
            const normalizedUrl = `${linkUrl.protocol}//${linkUrl.hostname}${linkUrl.pathname}${linkUrl.search}`;
            
            if (!discoveredUrls.has(normalizedUrl) && !processedUrls.has(normalizedUrl)) {
              discoveredUrls.add(normalizedUrl);
              if (discoveredUrls.size < maxPages) {
                urlsToProcess.push(normalizedUrl);
              }
            }
          } catch (urlError) {
            // Skip invalid URLs
            continue;
          }
        }

      } catch (error) {
        console.error(`Error discovering URLs from ${currentUrl}:`, error.message);
        continue;
      }
    }

    return Array.from(discoveredUrls);
  }

  async scrapePage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        timeout: this.timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, noscript, nav, header, footer, .nav, .navigation, .menu').remove();

      // Extract structured data
      const title = $('title').text().trim() || $('h1').first().text().trim() || '';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';
      const keywords = $('meta[name="keywords"]').attr('content') || '';
      
      // Extract main content - prioritize main content areas
      let textContent = '';
      const contentSelectors = ['main', 'article', '.content', '.main-content', '#content', 'body'];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          textContent = element.text();
          break;
        }
      }
      
      if (!textContent) {
        textContent = $('body').text();
      }
      
      // Clean up text content
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      // Extract headings for structure
      const headings = [];
      $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 0 && text.length < 200) {
          headings.push({
            level: parseInt(el.tagName.charAt(1)),
            text: text
          });
        }
      });

      // Extract navigation links
      const navLinks = [];
      $('nav a, .nav a, .navigation a, .menu a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        if (text.length > 0 && href) {
          try {
            const absoluteUrl = new URL(href, url).toString();
            navLinks.push({
              text: text,
              href: absoluteUrl
            });
          } catch {
            // Skip invalid URLs
          }
        }
      });

      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

      // Validate content quality
      if (wordCount < 50) {
        throw new Error('Page content too short or empty');
      }

      return {
        url,
        title,
        description,
        keywords,
        textContent,
        headings,
        navLinks,
        wordCount,
        scrapedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Check if it's HTTP or HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }

      // Check if hostname exists
      if (!parsedUrl.hostname) {
        return { valid: false, error: 'Invalid hostname' };
      }

      // Block localhost and private IPs for security
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.includes('0.0.0.0')) {
        return { valid: false, error: 'Private and local URLs are not allowed' };
      }

      return { valid: true, url: parsedUrl.toString() };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }
}

export default WebScrapingService;