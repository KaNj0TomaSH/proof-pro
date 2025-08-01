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
    if (content.length === 0) {
      return 'Информация не найдена.';
    }

    // Take first non-empty content
    const firstContent = content.find(c => c && c.trim().length > 0) || content[0];
    
    // Clean up the content
    const cleaned = firstContent
      .replace(/\s+/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
    
    // Split into sentences
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
    
    // Take first 3-5 sentences as summary
    const summary = sentences
      .slice(0, 5)
      .join(' ')
      .trim();
    
    // Limit length
    if (summary.length > 500) {
      return summary.substring(0, 497) + '...';
    }
    
    return summary || 'Краткое описание недоступно.';
  }
}