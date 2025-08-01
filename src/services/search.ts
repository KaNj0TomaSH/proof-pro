import axios from 'axios';
import { Source } from '../types/index.js';
import { isTrustedDomain, getSourceReliability } from '../config/trustedSources.js';

interface SearchEngine {
  search(query: string, limit: number): Promise<SearchResult[]>;
}

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

export class SearchService {
  async search(query: string, limit: number = 10): Promise<Source[]> {
    try {
      // Using DuckDuckGo HTML version as it doesn't require API key
      const results = await this.searchDuckDuckGo(query, limit);
      
      return results.map(result => ({
        url: result.url,
        title: result.title,
        domain: new URL(result.url).hostname.replace('www.', ''),
        isTrusted: isTrustedDomain(result.url),
      }));
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to Google search if available
      return this.fallbackGoogleSearch(query, limit);
    }
  }

  private async searchDuckDuckGo(query: string, limit: number): Promise<SearchResult[]> {
    const searchUrl = 'https://html.duckduckgo.com/html/';
    
    try {
      const response = await axios.post(searchUrl, `q=${encodeURIComponent(query)}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const results: SearchResult[] = [];
      
      // Parse HTML response (simplified parsing)
      const linkRegex = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
      const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([^<]+)<\/a>/g;
      
      let match;
      while ((match = linkRegex.exec(response.data)) !== null && results.length < limit) {
        const url = match[1];
        const title = match[2];
        
        // Skip DuckDuckGo internal links
        if (url.startsWith('//duckduckgo.com')) continue;
        
        results.push({
          url: url.startsWith('http') ? url : `https:${url}`,
          title: this.decodeHtml(title),
          snippet: '',
        });
      }

      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      throw error;
    }
  }

  private async fallbackGoogleSearch(query: string, limit: number): Promise<Source[]> {
    // This is a fallback that returns trusted sources based on keywords
    // In production, you would implement actual Google Custom Search API
    
    const keywords = query.toLowerCase().split(' ');
    const trustedUrls = [
      { url: 'https://www.bbc.com/search', title: 'BBC Search Results' },
      { url: 'https://www.reuters.com/search', title: 'Reuters Search' },
      { url: 'https://apnews.com/search', title: 'AP News Search' },
    ];

    return trustedUrls.map(item => ({
      url: item.url,
      title: item.title,
      domain: new URL(item.url).hostname.replace('www.', ''),
      isTrusted: true,
    }));
  }

  private decodeHtml(html: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };

    return html.replace(/&[^;]+;/g, match => entities[match] || match);
  }

  async searchTrustedSourcesFirst(query: string, limit: number = 10): Promise<Source[]> {
    const allResults = await this.search(query, limit * 2);
    
    // Sort by trust and reliability
    const sorted = allResults.sort((a, b) => {
      const aReliability = getSourceReliability(a.url);
      const bReliability = getSourceReliability(b.url);
      
      // Prioritize trusted sources
      if (a.isTrusted && !b.isTrusted) return -1;
      if (!a.isTrusted && b.isTrusted) return 1;
      
      // Then sort by reliability
      return bReliability - aReliability;
    });

    return sorted.slice(0, limit);
  }
}