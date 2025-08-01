import axios from 'axios';
import { config } from '../config/index.js';
import { N8NWebhookPayload, ResearchRequest, CrossCheckResult } from '../types/index.js';

export class N8NService {
  private webhookUrl: string;
  private apiKey: string;

  constructor() {
    this.webhookUrl = config.n8n.webhookUrl;
    this.apiKey = config.n8n.apiKey;
  }

  async triggerWorkflow(action: string, data: any): Promise<any> {
    if (!this.webhookUrl) {
      console.warn('N8N webhook URL not configured');
      return null;
    }

    const payload: N8NWebhookPayload = {
      action,
      data,
      timestamp: new Date(),
    };

    try {
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
        },
        timeout: 60000, // 60 seconds timeout for workflows
      });

      return response.data;
    } catch (error) {
      console.error('N8N workflow error:', error);
      throw new Error('Failed to trigger N8N workflow');
    }
  }

  async startResearchWorkflow(request: ResearchRequest): Promise<string> {
    const result = await this.triggerWorkflow('start_research', {
      query: request.query,
      userId: request.userId,
      chatId: request.chatId,
      timestamp: request.timestamp,
    });

    return result?.workflowId || 'local_research';
  }

  async enhanceSearchResults(query: string, urls: string[]): Promise<any[]> {
    if (!this.webhookUrl) {
      return [];
    }

    try {
      const result = await this.triggerWorkflow('enhance_search', {
        query,
        urls,
      });

      return result?.enhancedResults || [];
    } catch (error) {
      console.error('Failed to enhance search results:', error);
      return [];
    }
  }

  async processCrossCheck(data: any): Promise<CrossCheckResult | null> {
    if (!this.webhookUrl) {
      return null;
    }

    try {
      const result = await this.triggerWorkflow('cross_check', data);
      return result?.crossCheckResult || null;
    } catch (error) {
      console.error('Failed to process cross-check:', error);
      return null;
    }
  }

  async generateSummary(content: string[], query: string): Promise<string> {
    if (!this.webhookUrl) {
      // Fallback to simple summary
      return this.simpleSummary(content, query);
    }

    try {
      const result = await this.triggerWorkflow('generate_summary', {
        content,
        query,
      });

      return result?.summary || this.simpleSummary(content, query);
    } catch (error) {
      console.error('Failed to generate summary via N8N:', error);
      return this.simpleSummary(content, query);
    }
  }

  private simpleSummary(content: string[], query: string): string {
    // Simple fallback summary when N8N is not available
    const combined = content.join(' ');
    const sentences = combined.match(/[^.!?]+[.!?]+/g) || [];
    
    // Extract most relevant sentences
    const queryWords = query.toLowerCase().split(' ');
    const relevantSentences = sentences
      .filter(s => queryWords.some(word => s.toLowerCase().includes(word)))
      .slice(0, 5);

    return relevantSentences.join(' ') || 'No relevant summary available.';
  }
}