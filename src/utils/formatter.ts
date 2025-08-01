import { CrossCheckResult, Quote, TopicSummary } from '../types/index.js';

export function formatResults(result: CrossCheckResult): string {
  let output = '';

  // Header with verdict
  output += formatHeader(result);
  output += '\n\n';

  // Topic summaries
  if (result.summary.length > 0) {
    output += formatSummaries(result.summary);
    output += '\n\n';
  }

  // Key quotes
  output += formatQuotes(result);
  output += '\n\n';

  // Sources
  output += formatSources(result);

  return output;
}

function formatHeader(result: CrossCheckResult): string {
  const verdictEmoji = {
    'verified': '✅',
    'disputed': '❌',
    'unverified': '❓',
    'mixed': '⚠️',
  };

  const verdictText = {
    'verified': 'Подтверждено',
    'disputed': 'Опровергнуто',
    'unverified': 'Не подтверждено',
    'mixed': 'Смешанные результаты',
  };

  const confidence = Math.round(result.confidence * 100);

  return `
📊 *Результаты исследования*

*Запрос:* _${escapeMarkdown(result.originalClaim)}_

*Вердикт:* ${verdictEmoji[result.verdict]} ${verdictText[result.verdict]}
*Уверенность:* ${confidence}%
*Источников проанализировано:* ${result.sources.length}
`;
}

function formatSummaries(summaries: TopicSummary[]): string {
  let output = '📝 *Краткое содержание по темам:*\n';

  for (const summary of summaries) {
    output += `\n*${escapeMarkdown(summary.topic)}*\n`;
    output += `${escapeMarkdown(summary.summary)}\n`;
    output += `_Источников: ${summary.sources.length}_\n`;
  }

  return output;
}

function formatQuotes(result: CrossCheckResult): string {
  let output = '💬 *Ключевые цитаты:*\n';

  // Get top quotes from all sources
  const allQuotes = result.sources
    .flatMap(source => source.quotes)
    .slice(0, 5);

  if (allQuotes.length === 0) {
    return output + '\n_Релевантные цитаты не найдены_';
  }

  for (const quote of allQuotes) {
    output += formatSingleQuote(quote);
  }

  return output;
}

function formatSingleQuote(quote: Quote): string {
  let output = '\n';
  
  // Original quote
  output += `> "${escapeMarkdown(quote.text)}"\n`;
  
  // Translation if available
  if (quote.translation) {
    output += `> _Перевод: "${escapeMarkdown(quote.translation)}"_\n`;
  }
  
  // Source
  output += `[Источник](${quote.sourceUrl})\n`;

  return output;
}

function formatSources(result: CrossCheckResult): string {
  let output = '📚 *Проанализированные источники:*\n';

  // Group by trusted/untrusted
  const trustedSources = result.sources.filter(s => s.source.isTrusted);
  const otherSources = result.sources.filter(s => !s.source.isTrusted);

  if (trustedSources.length > 0) {
    output += '\n*Доверенные источники:*\n';
    for (const source of trustedSources) {
      const relevance = Math.round(source.relevanceScore * 100);
      output += `• [${escapeMarkdown(source.source.title)}](${source.source.url}) - ${relevance}% релевантности\n`;
    }
  }

  if (otherSources.length > 0) {
    output += '\n*Другие источники:*\n';
    for (const source of otherSources) {
      const relevance = Math.round(source.relevanceScore * 100);
      output += `• [${escapeMarkdown(source.source.title)}](${source.source.url}) - ${relevance}% релевантности\n`;
    }
  }

  return output;
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
    .trim();
}

export function formatError(error: string): string {
  return `
❌ *Ошибка при выполнении исследования*

${escapeMarkdown(error)}

Пожалуйста, попробуйте:
• Переформулировать запрос
• Проверить правильность написания
• Сделать запрос более конкретным
`;
}

export function formatProgress(stage: string, current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const progressBar = createProgressBar(percentage);

  return `
🔍 *${stage}*

${progressBar} ${percentage}%
_Обработано ${current} из ${total}_
`;
}

function createProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  
  return '▓'.repeat(filled) + '░'.repeat(empty);
}