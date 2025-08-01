import { TrustedSource } from '../types/index.js';

export const trustedSources: TrustedSource[] = [
  // International News
  { domain: 'bbc.com', name: 'BBC', category: 'news', reliability: 0.95 },
  { domain: 'reuters.com', name: 'Reuters', category: 'news', reliability: 0.95 },
  { domain: 'apnews.com', name: 'Associated Press', category: 'news', reliability: 0.95 },
  { domain: 'theguardian.com', name: 'The Guardian', category: 'news', reliability: 0.9 },
  { domain: 'nytimes.com', name: 'The New York Times', category: 'news', reliability: 0.9 },
  { domain: 'washingtonpost.com', name: 'The Washington Post', category: 'news', reliability: 0.9 },
  { domain: 'wsj.com', name: 'The Wall Street Journal', category: 'news', reliability: 0.9 },
  { domain: 'economist.com', name: 'The Economist', category: 'news', reliability: 0.9 },
  
  // Fact-checking organizations
  { domain: 'snopes.com', name: 'Snopes', category: 'fact-check', reliability: 0.95 },
  { domain: 'factcheck.org', name: 'FactCheck.org', category: 'fact-check', reliability: 0.95 },
  { domain: 'politifact.com', name: 'PolitiFact', category: 'fact-check', reliability: 0.95 },
  
  // Academic and Scientific
  { domain: 'nature.com', name: 'Nature', category: 'academic', reliability: 0.98 },
  { domain: 'science.org', name: 'Science', category: 'academic', reliability: 0.98 },
  { domain: 'pubmed.ncbi.nlm.nih.gov', name: 'PubMed', category: 'academic', reliability: 0.98 },
  { domain: 'scholar.google.com', name: 'Google Scholar', category: 'academic', reliability: 0.95 },
  
  // Government and Official
  { domain: 'who.int', name: 'World Health Organization', category: 'official', reliability: 0.95 },
  { domain: 'un.org', name: 'United Nations', category: 'official', reliability: 0.95 },
  { domain: 'europa.eu', name: 'European Union', category: 'official', reliability: 0.95 },
];

export function isTrustedDomain(url: string): boolean {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return trustedSources.some(source => 
      domain === source.domain || domain.endsWith(`.${source.domain}`)
    );
  } catch {
    return false;
  }
}

export function getSourceReliability(url: string): number {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const source = trustedSources.find(source => 
      domain === source.domain || domain.endsWith(`.${source.domain}`)
    );
    return source?.reliability || 0.5;
  } catch {
    return 0.5;
  }
}