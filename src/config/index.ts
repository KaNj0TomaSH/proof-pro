import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    token: process.env.BOT_TOKEN || '',
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    apiKey: process.env.N8N_API_KEY || '',
  },
  google: {
    translateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
  },
  removepaywall: {
    url: process.env.REMOVEPAYWALL_URL || 'https://removepaywall.com/',
  },
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  search: {
    maxResults: 10,
    timeout: 30000, // 30 seconds
  },
  translation: {
    enabled: !!process.env.GOOGLE_TRANSLATE_API_KEY,
    targetLanguage: 'ru', // Default to Russian
  },
};

export function validateConfig() {
  if (!config.telegram.token) {
    throw new Error('BOT_TOKEN is required in environment variables');
  }
  
  if (config.n8n.webhookUrl && !config.n8n.apiKey) {
    console.warn('N8N webhook URL is set but API key is missing');
  }
}