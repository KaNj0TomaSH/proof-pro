export interface ResearchRequest {
  query: string;
  userId: number;
  chatId: number;
  timestamp: Date;
}

export interface Source {
  url: string;
  title: string;
  domain: string;
  isTrusted: boolean;
  publishDate?: Date;
}

export interface SearchResult {
  source: Source;
  content: string;
  relevanceScore: number;
  quotes: Quote[];
}

export interface Quote {
  text: string;
  context: string;
  sourceUrl: string;
  position: number;
  translation?: string;
}

export interface CrossCheckResult {
  originalClaim: string;
  sources: SearchResult[];
  summary: TopicSummary[];
  verdict: 'verified' | 'disputed' | 'unverified' | 'mixed';
  confidence: number;
}

export interface TopicSummary {
  topic: string;
  summary: string;
  sources: string[];
  quotes: Quote[];
}

export interface TrustedSource {
  domain: string;
  name: string;
  category: string;
  reliability: number;
}

export interface N8NWebhookPayload {
  action: string;
  data: any;
  timestamp: Date;
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishDate?: Date;
  isPaywalled: boolean;
}