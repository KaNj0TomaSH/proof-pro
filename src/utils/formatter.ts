import { CrossCheckResult, Quote, TopicSummary } from '../types/index.js';
import { formatNumber, formatPercentage, formatSourceCount, formatDate } from './locale.js';

export function formatResults(result: CrossCheckResult): string {
  const sections = [];

  // Header with verdict
  sections.push(formatHeader(result));

  // Topic summaries
  if (result.summary.length > 0) {
    sections.push(formatSummaries(result.summary));
  }

  // Key quotes
  sections.push(formatQuotes(result));

  // Sources
  sections.push(formatSources(result));

  // Join sections with proper spacing
  return sections.join('\n\n------------------------\n\n');
}

function formatHeader(result: CrossCheckResult): string {
  const verdictEmoji = {
    'verified': '✓',
    'disputed': '✗',
    'unverified': '?',
    'mixed': '!',
  };

  const verdictText = {
    'verified': 'Подтверждено',
    'disputed': 'Опровергнуто',
    'unverified': 'Не подтверждено',
    'mixed': 'Смешанные результаты',
  };

  const confidence = Math.round(result.confidence * 100);

  return `*РЕЗУЛЬТАТЫ ИССЛЕДОВАНИЯ*

*Запрос:*
_${escapeMarkdown(result.originalClaim)}_

*Вердикт:* ${verdictEmoji[result.verdict]} ${verdictText[result.verdict]}
*Уверенность:* ${formatPercentage(confidence)}
*Проанализировано:* ${formatSourceCount(result.sources.length)}`;
}

function formatSummaries(summaries: TopicSummary[]): string {
  let output = '*КРАТКОЕ СОДЕРЖАНИЕ ПО ТЕМАМ*';

  for (const summary of summaries) {
    output += `\n\n* *${escapeMarkdown(summary.topic)}*\n`;
    
    // Split summary into paragraphs for better readability
    const paragraphs = summary.summary.split(/\n+/).filter(p => p.trim());
    for (const paragraph of paragraphs) {
      output += `\n${escapeMarkdown(paragraph.trim())}`;
    }
    
    output += `\n\n_Использовано ${formatSourceCount(summary.sources.length)}_`;
  }

  return output;
}

function formatQuotes(result: CrossCheckResult): string {
  let output = '*КЛЮЧЕВЫЕ ЦИТАТЫ*';

  // Get top quotes from all sources
  const allQuotes = result.sources
    .flatMap(source => source.quotes)
    .slice(0, 5);

  if (allQuotes.length === 0) {
    return output + '\n\n_Релевантные цитаты не найдены_';
  }

  let quoteIndex = 1;
  for (const quote of allQuotes) {
    output += `\n\n${quoteIndex}. ` + formatSingleQuote(quote);
    quoteIndex++;
  }

  return output;
}

function formatSingleQuote(quote: Quote): string {
  let output = '';
  
  // Original quote with proper formatting
  const cleanText = quote.text.trim().replace(/\s+/g, ' ');
  output += `_"${escapeMarkdown(cleanText)}"_`;
  
  // Translation if available
  if (quote.translation) {
    const cleanTranslation = quote.translation.trim().replace(/\s+/g, ' ');
    output += `\n   \n   [RU] _"${escapeMarkdown(cleanTranslation)}"_`;
  }
  
  // Source with better formatting
  output += `\n   \n   [Источник](${quote.sourceUrl})`;

  return output;
}

function formatSources(result: CrossCheckResult): string {
  let output = '*ПРОАНАЛИЗИРОВАННЫЕ ИСТОЧНИКИ*';

  // Group by trusted/untrusted
  const trustedSources = result.sources.filter(s => s.source.isTrusted);
  const otherSources = result.sources.filter(s => !s.source.isTrusted);

  if (trustedSources.length > 0) {
    output += '\n\n[✓] *Доверенные источники:*';
    for (const source of trustedSources) {
      const relevance = Math.round(source.relevanceScore * 100);
      const title = truncateTitle(source.source.title);
      output += `\n• [${escapeMarkdown(title)}](${source.source.url})\n  _Релевантность: ${formatPercentage(relevance)}_`;
    }
  }

  if (otherSources.length > 0) {
    output += '\n\n[o] *Другие источники:*';
    for (const source of otherSources) {
      const relevance = Math.round(source.relevanceScore * 100);
      const title = truncateTitle(source.source.title);
      output += `\n• [${escapeMarkdown(title)}](${source.source.url})\n  _Релевантность: ${formatPercentage(relevance)}_`;
    }
  }

  return output;
}

function truncateTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

function escapeMarkdown(text: string): string {
  // Escape only necessary Markdown characters
  return text
    .replace(/([_*[\]()~`>#+|{}])/g, '\\$1')
    .replace(/\\/g, '') // Remove existing backslashes
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

export function formatError(error: string): string {
  return `*ОШИБКА ПРИ ВЫПОЛНЕНИИ ИССЛЕДОВАНИЯ*

${escapeMarkdown(error)}

*Попробуйте:*
• Переформулировать запрос
• Проверить правильность написания
• Сделать запрос более конкретным
• Использовать ключевые слова

_Если проблема повторяется, обратитесь к администратору._`;
}

export function formatProgress(stage: string, current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const progressBar = createProgressBar(percentage);

  return `*${stage}*

${progressBar} ${formatPercentage(percentage)}

_Обработано ${formatNumber(current)} из ${formatNumber(total)}_`;
}

function createProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  
  return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
}

// New helper function for welcome messages
export function formatWelcome(): string {
  return `*Добро пожаловать в Research Bot!*

Я помогу вам найти и проверить информацию по любой теме.

*Что я умею:*
• Искать информацию в надежных источниках
• Проверять факты (fact-checking)
• Выделять ключевые цитаты
• Переводить найденную информацию
• Создавать краткие выводы

*Как использовать:*
Просто отправьте мне ваш запрос текстом.

*Примеры запросов:*
• "Влияние ИИ на журналистику"
• "Климатические изменения 2024"
• "Последние новости о выборах"

Готов помочь с вашим исследованием!`;
}