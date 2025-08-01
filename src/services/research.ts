import { ResearchRequest, CrossCheckResult, SearchResult, Quote, TopicSummary } from '../types/index.js';
import { SearchService } from './search.js';
import { ScraperService } from './scraper.js';
import { N8NService } from './n8n.js';
import { TranslationService } from './translation.js';
import { getSourceReliability } from '../config/trustedSources.js';

export class ResearchService {
  private searchService: SearchService;
  private scraperService: ScraperService;
  private n8nService: N8NService;
  private translationService: TranslationService;

  constructor() {
    this.searchService = new SearchService();
    this.scraperService = new ScraperService();
    this.n8nService = new N8NService();
    this.translationService = new TranslationService();
  }

  async performResearch(request: ResearchRequest): Promise<CrossCheckResult> {
    try {
      // Start N8N workflow if configured
      const workflowId = await this.n8nService.startResearchWorkflow(request);
      console.log(`Started research workflow: ${workflowId}`);

      // Search for sources
      const sources = await this.searchService.searchTrustedSourcesFirst(
        request.query,
        10
      );

      // Process each source
      const searchResults = await this.processMultipleSources(
        sources.map(s => s.url),
        request.query
      );

      // Perform cross-check analysis
      const crossCheckResult = await this.analyzeCrossCheck(
        request.query,
        searchResults
      );

      // Try to enhance with N8N workflow results
      const n8nEnhancement = await this.n8nService.processCrossCheck({
        query: request.query,
        results: searchResults,
        crossCheck: crossCheckResult,
      });

      return n8nEnhancement || crossCheckResult;
    } catch (error) {
      console.error('Research error:', error);
      throw error;
    }
  }

  private async processMultipleSources(
    urls: string[],
    query: string
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Process URLs in parallel batches
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.processSingleSource(url, query))
      );

      results.push(...batchResults.filter(r => r !== null) as SearchResult[]);
    }

    return results;
  }

  private async processSingleSource(
    url: string,
    query: string
  ): Promise<SearchResult | null> {
    try {
      const scraped = await this.scraperService.scrapeContent(url);
      const quotes = await this.scraperService.extractQuotes(
        scraped.content,
        query
      );

      // Translate quotes if needed
      const translatedQuotes = await this.translateQuotes(quotes, url);

      const searchResult: SearchResult = {
        source: {
          url: scraped.url,
          title: scraped.title,
          domain: new URL(scraped.url).hostname.replace('www.', ''),
          isTrusted: getSourceReliability(scraped.url) > 0.8,
          publishDate: scraped.publishDate,
        },
        content: scraped.content.slice(0, 1000),
        relevanceScore: this.calculateRelevance(scraped.content, query),
        quotes: translatedQuotes,
      };

      return searchResult;
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      return null;
    }
  }

  private async translateQuotes(
    quotes: string[],
    sourceUrl: string
  ): Promise<Quote[]> {
    return Promise.all(
      quotes.map(async (text, index) => {
        const translation = await this.translationService.translate(text);
        return {
          text,
          context: text,
          sourceUrl,
          position: index,
          translation,
        };
      })
    );
  }

  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    
    let score = 0;
    for (const word of queryWords) {
      const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += occurrences;
    }

    // Normalize score (0-1)
    return Math.min(score / (queryWords.length * 10), 1);
  }

  private async analyzeCrossCheck(
    query: string,
    results: SearchResult[]
  ): Promise<CrossCheckResult> {
    // Group results by topic/claim
    const topicGroups = this.groupByTopics(results, query);
    
    // Create summaries for each topic
    const summaries = await this.createTopicSummaries(topicGroups);

    // Determine verdict based on source agreement
    const verdict = this.determineVerdict(results);
    const confidence = this.calculateConfidence(results);

    return {
      originalClaim: query,
      sources: results,
      summary: summaries,
      verdict,
      confidence,
    };
  }

  private groupByTopics(
    results: SearchResult[],
    query: string
  ): Map<string, SearchResult[]> {
    // Simple topic grouping based on content similarity
    const groups = new Map<string, SearchResult[]>();
    
    // For now, group all results under main query topic
    groups.set(query, results);

    // TODO: Implement more sophisticated topic clustering
    
    return groups;
  }

  private async createTopicSummaries(
    topicGroups: Map<string, SearchResult[]>
  ): Promise<TopicSummary[]> {
    const summaries: TopicSummary[] = [];

    for (const [topic, results] of topicGroups) {
      const content = results.map(r => r.content);
      const summary = await this.n8nService.generateSummary(content, topic);
      
      const topicSummary: TopicSummary = {
        topic,
        summary,
        sources: results.map(r => r.source.url),
        quotes: results.flatMap(r => r.quotes).slice(0, 5),
      };

      summaries.push(topicSummary);
    }

    return summaries;
  }

  private determineVerdict(results: SearchResult[]): 'verified' | 'disputed' | 'unverified' | 'mixed' {
    if (results.length === 0) return 'unverified';
    
    const trustedResults = results.filter(r => r.source.isTrusted);
    if (trustedResults.length === 0) return 'unverified';

    // Simple logic: if all trusted sources agree (high relevance), it's verified
    const highRelevanceTrusted = trustedResults.filter(r => r.relevanceScore > 0.7);
    
    if (highRelevanceTrusted.length === trustedResults.length && trustedResults.length > 2) {
      return 'verified';
    } else if (highRelevanceTrusted.length === 0) {
      return 'disputed';
    } else {
      return 'mixed';
    }
  }

  private calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;

    const weights = results.map(r => {
      const reliability = getSourceReliability(r.source.url);
      return reliability * r.relevanceScore;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const averageWeight = totalWeight / results.length;

    return Math.min(averageWeight, 1);
  }
}