import * as cheerio from 'cheerio';
import { URL } from 'url';

class WebScrapingService {
  constructor() {
    this.maxPagesPerSite = parseInt(process.env.MAX_PAGES_PER_SITE) || 50;
    this.timeout = parseInt(process.env.SCRAPING_TIMEOUT) || 30000;
    this.userAgent = process.env.USER_AGENT || 'Chatify-Bot/1.0.0';
    this.delay = 1000; // 1 second delay between requests
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
        errors: [],
        sitemapFound: false
      }
    };

    try {
      // First, try to get URLs from sitemap
      let urlsToScrape = await this.getSitemapUrls(baseUrl);
      
      if (urlsToScrape.length === 0) {
        // Fallback to crawling if no sitemap
        console.log('📄 No sitemap found, crawling website...');
        urlsToScrape = await this.crawlWebsite(baseUrl, { maxPages, includeSubdomains, excludePatterns });
      } else {
        console.log(`📄 Found sitemap with ${urlsToScrape.length} URLs`);
        scrapedData.metadata.sitemapFound = true;
      }

      // Limit URLs to maxPages
      urlsToScrape = urlsToScrape.slice(0, maxPages);
      console.log(`📊 Processing ${urlsToScrape.length} URLs`);

      // Scrape each URL
      for (let i = 0; i < urlsToScrape.length; i++) {
        const url = urlsToScrape[i];
        console.log(`🔍 Scraping ${i + 1}/${urlsToScrape.length}: ${url}`);

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

        // Add delay between requests
        if (i < urlsToScrape.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      }

      scrapedData.metadata.totalPages = scrapedData.pages.length;
      console.log(`✅ Scraping completed: ${scrapedData.pages.length} pages scraped`);

      return scrapedData;

    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw new Error(`Website scraping failed: ${error.message}`);
    }
  }

  async getSitemapUrls(baseUrl) {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemaps.xml`,
      `${baseUrl}/robots.txt`
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        console.log(`🔍 Checking for sitemap: ${sitemapUrl}`);
        
        if (sitemapUrl.endsWith('robots.txt')) {
          const urls = await this.parseRobotsTxt(sitemapUrl);
          if (urls.length > 0) return urls;
        } else {
          const urls = await this.parseSitemap(sitemapUrl);
          if (urls.length > 0) return urls;
        }
      } catch (error) {
        console.log(`❌ Failed to fetch ${sitemapUrl}: ${error.message}`);
        continue;
      }
    }

    return [];
  }

  async parseRobotsTxt(robotsUrl) {
    try {
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.timeout
      });

      if (!response.ok) return [];

      const text = await response.text();
      const sitemapUrls = [];
      
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().startsWith('sitemap:')) {
          const sitemapUrl = line.split(':', 2)[1].trim();
          sitemapUrls.push(sitemapUrl);
        }
      }

      // Parse found sitemaps
      const allUrls = [];
      for (const sitemapUrl of sitemapUrls) {
        try {
          const urls = await this.parseSitemap(sitemapUrl);
          allUrls.push(...urls);
        } catch (error) {
          console.error(`Error parsing sitemap ${sitemapUrl}:`, error.message);
        }
      }

      return allUrls;
    } catch (error) {
      return [];
    }
  }

  async parseSitemap(sitemapUrl) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.timeout
      });

      if (!response.ok) return [];

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      const urls = [];

      // Check for sitemap index
      $('sitemap loc').each((i, el) => {
        const sitemapUrl = $(el).text().trim();
        if (sitemapUrl) {
          // Recursively parse sub-sitemaps (limit depth to prevent infinite loops)
          this.parseSitemap(sitemapUrl).then(subUrls => {
            urls.push(...subUrls);
          }).catch(() => {});
        }
      });

      // Extract URLs from sitemap
      $('url loc').each((i, el) => {
        const url = $(el).text().trim();
        if (url && this.isValidUrl(url)) {
          urls.push(url);
        }
      });

      return urls;
    } catch (error) {
      return [];
    }
  }

  async crawlWebsite(baseUrl, options) {
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
        const links = await this.extractLinksFromPage(currentUrl);

        for (const link of links) {
          try {
            const linkUrl = new URL(link, currentUrl);
            const linkDomain = linkUrl.hostname;

            // Check domain restrictions
            if (!includeSubdomains && linkDomain !== baseDomain) continue;
            if (includeSubdomains && !linkDomain.includes(baseDomain.split('.').slice(-2).join('.'))) continue;

            // Check exclude patterns
            if (excludePatterns.some(pattern => link.includes(pattern))) continue;

            // Normalize URL
            const normalizedUrl = `${linkUrl.protocol}//${linkUrl.hostname}${linkUrl.pathname}`;
            
            if (!discoveredUrls.has(normalizedUrl) && discoveredUrls.size < maxPages) {
              discoveredUrls.add(normalizedUrl);
              urlsToProcess.push(normalizedUrl);
            }
          } catch (urlError) {
            continue;
          }
        }

      } catch (error) {
        console.error(`Error crawling ${currentUrl}:`, error.message);
        continue;
      }

      // Add delay between crawl requests
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    return Array.from(discoveredUrls);
  }

  async extractLinksFromPage(url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.timeout
      });

      if (!response.ok) return [];

      const html = await response.text();
      const $ = cheerio.load(html);

      const links = [];
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          links.push(href);
        }
      });

      return links;
    } catch (error) {
      return [];
    }
  }

  async scrapePage(url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, noscript, nav, header, footer, .advertisement, .ads').remove();

      // Extract structured data
      const title = $('title').text().trim() || '';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';
      const keywords = $('meta[name="keywords"]').attr('content') || '';
      
      // Extract main content (prioritize main content areas)
      let textContent = '';
      const contentSelectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '#content',
        '#main',
        '.post-content',
        '.entry-content'
      ];

      for (const selector of contentSelectors) {
        const content = $(selector).text();
        if (content && content.length > textContent.length) {
          textContent = content;
        }
      }

      // Fallback to body if no main content found
      if (!textContent) {
        textContent = $('body').text();
      }

      // Clean up text content
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim();

      // Extract headings for structure
      const headings = [];
      $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 0) {
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
          navLinks.push({ text, href });
        }
      });

      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

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

  isValidUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }
}

export default WebScrapingService;