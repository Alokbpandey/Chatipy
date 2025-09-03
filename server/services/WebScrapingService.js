import puppeteer from 'puppeteer';
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
      excludePatterns = ['/admin', '/login', '/api', '.pdf', '.jpg', '.png', '.gif']
    } = options;

    let browser;
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
      // Launch browser
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Set timeout
      page.setDefaultTimeout(this.timeout);

      // Discover all URLs from the website
      const urlsToScrape = await this.discoverUrls(page, baseUrl, {
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
          const pageData = await this.scrapePage(page, url);
          if (pageData) {
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

      return scrapedData;

    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw new Error(`Website scraping failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async discoverUrls(page, baseUrl, options) {
    const { maxPages, includeSubdomains, excludePatterns } = options;
    const discoveredUrls = new Set();
    const urlsToProcess = [baseUrl];
    const processedUrls = new Set();

    const baseDomain = new URL(baseUrl).hostname;

    while (urlsToProcess.length > 0 && discoveredUrls.size < maxPages) {
      const currentUrl = urlsToProcess.shift();
      
      if (processedUrls.has(currentUrl)) continue;
      processedUrls.add(currentUrl);

      try {
        await page.goto(currentUrl, { waitUntil: 'networkidle0', timeout: this.timeout });
        
        // Extract all links from the page
        const links = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          return anchors.map(anchor => anchor.href).filter(href => href);
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

            // Normalize URL (remove fragments and query params for discovery)
            const normalizedUrl = `${linkUrl.protocol}//${linkUrl.hostname}${linkUrl.pathname}`;
            
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

        discoveredUrls.add(currentUrl);

      } catch (error) {
        console.error(`Error discovering URLs from ${currentUrl}:`, error.message);
        continue;
      }
    }

    return Array.from(discoveredUrls);
  }

  async scrapePage(page, url) {
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: this.timeout });

      // Wait for dynamic content to load
      await page.waitForTimeout(2000);

      // Get page content
      const content = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());

        // Extract structured data
        const title = document.title || '';
        const description = document.querySelector('meta[name="description"]')?.content || '';
        const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
        
        // Extract main content
        const mainContent = document.querySelector('main') || document.body;
        const textContent = mainContent?.innerText || '';
        
        // Extract headings for structure
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.innerText.trim()
          }))
          .filter(h => h.text.length > 0);

        // Extract navigation links
        const navLinks = Array.from(document.querySelectorAll('nav a, .nav a, .navigation a'))
          .map(a => ({
            text: a.innerText.trim(),
            href: a.href
          }))
          .filter(link => link.text.length > 0);

        return {
          title,
          description,
          keywords,
          textContent: textContent.replace(/\s+/g, ' ').trim(),
          headings,
          navLinks,
          wordCount: textContent.split(/\s+/).length
        };
      });

      return {
        url,
        ...content,
        scrapedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  async scrapeWithFallback(url) {
    try {
      // Try with Puppeteer first (for dynamic content)
      return await this.scrapeWebsite(url);
    } catch (puppeteerError) {
      console.log('Puppeteer failed, trying with Cheerio...');
      
      try {
        // Fallback to Cheerio for static content
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $('script, style, noscript').remove();

        const pageData = {
          url,
          title: $('title').text() || '',
          description: $('meta[name="description"]').attr('content') || '',
          keywords: $('meta[name="keywords"]').attr('content') || '',
          textContent: $('body').text().replace(/\s+/g, ' ').trim(),
          headings: $('h1, h2, h3, h4, h5, h6').map((i, el) => ({
            level: parseInt(el.tagName.charAt(1)),
            text: $(el).text().trim()
          })).get().filter(h => h.text.length > 0),
          navLinks: $('nav a, .nav a, .navigation a').map((i, el) => ({
            text: $(el).text().trim(),
            href: $(el).attr('href')
          })).get().filter(link => link.text.length > 0),
          scrapedAt: new Date().toISOString()
        };

        pageData.wordCount = pageData.textContent.split(/\s+/).length;

        return {
          baseUrl: url,
          pages: [pageData],
          metadata: {
            totalPages: 1,
            scrapedAt: new Date().toISOString(),
            errors: []
          }
        };

      } catch (cheerioError) {
        throw new Error(`Both scraping methods failed. Puppeteer: ${puppeteerError.message}, Cheerio: ${cheerioError.message}`);
      }
    }
  }
}

export default WebScrapingService;