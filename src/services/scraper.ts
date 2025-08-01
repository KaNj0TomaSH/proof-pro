import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedContent } from '../types/index.js';
import { config } from '../config/index.js';

export class ScraperService {
  private async fetchWithPaywallBypass(url: string): Promise<string> {
    try {
      // Try RemovePaywall service
      const paywallBypassUrl = `${config.removepaywall.url}${url}`;
      const response = await axios.get(paywallBypassUrl, {
        timeout: config.search.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      return response.data;
    } catch (error) {
      // Fallback to direct fetch
      return this.fetchDirect(url);
    }
  }

  private async fetchDirect(url: string): Promise<string> {
    const response = await axios.get(url, {
      timeout: config.search.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });
    return response.data;
  }

  async scrapeContent(url: string): Promise<ScrapedContent> {
    try {
      // Check if URL might be paywalled
      const paywalledDomains = [
        'wsj.com', 'nytimes.com', 'washingtonpost.com', 
        'ft.com', 'economist.com', 'bloomberg.com'
      ];
      
      const isPaywalled = paywalledDomains.some(domain => url.includes(domain));
      
      const html = isPaywalled 
        ? await this.fetchWithPaywallBypass(url)
        : await this.fetchDirect(url);

      const $ = cheerio.load(html);

      // Extract metadata
      const title = this.extractTitle($);
      const author = this.extractAuthor($);
      const publishDate = this.extractPublishDate($);
      const content = this.extractContent($);

      return {
        url,
        title,
        content,
        author,
        publishDate,
        isPaywalled,
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw new Error(`Failed to scrape content from ${url}`);
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    return (
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      'Untitled'
    ).trim();
  }

  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const author = 
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('[rel="author"]').text() ||
      $('.author').text() ||
      $('.by-author').text() ||
      $('.byline').text();

    return author ? author.trim() : undefined;
  }

  private extractPublishDate($: cheerio.CheerioAPI): Date | undefined {
    const dateString = 
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="publish_date"]').attr('content') ||
      $('time').attr('datetime') ||
      $('[itemprop="datePublished"]').attr('content');

    if (dateString) {
      try {
        return new Date(dateString);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private extractContent($: cheerio.CheerioAPI): string {
    // Remove script and style elements
    $('script, style, noscript').remove();

    // Try to find main content area
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.article-content',
      '.entry-content',
      '.post-content',
      '.content',
      'main',
      '#content',
    ];

    let content = '';
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body text
    if (!content) {
      content = $('body').text();
    }

    // Clean up content
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 10000); // Limit content length
  }

  async extractQuotes(content: string, query: string): Promise<string[]> {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const quotes: string[] = [];
    
    // Extract sentences that might be relevant to the query
    const queryWords = query.toLowerCase().split(' ');
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const relevanceScore = queryWords.filter(word => 
        sentenceLower.includes(word)
      ).length;
      
      if (relevanceScore > 0 && sentence.length > 30 && sentence.length < 500) {
        quotes.push(sentence.trim());
      }
    }

    // Sort by relevance and return top quotes
    return quotes
      .sort((a, b) => {
        const aScore = queryWords.filter(w => a.toLowerCase().includes(w)).length;
        const bScore = queryWords.filter(w => b.toLowerCase().includes(w)).length;
        return bScore - aScore;
      })
      .slice(0, 5);
  }
}