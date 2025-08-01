import { Context } from 'telegraf';
import { trustedSources } from '../../config/trustedSources.js';

export async function handleSources(ctx: Context) {
  const categorizedSources = trustedSources.reduce((acc, source) => {
    if (!acc[source.category]) {
      acc[source.category] = [];
    }
    acc[source.category].push(source);
    return acc;
  }, {} as Record<string, typeof trustedSources>);

  let message = '*Доверенные источники информации*\n\n';

  const categoryNames: Record<string, string> = {
    'news': 'Новостные агентства',
    'fact-check': 'Факт-чекинг',
    'academic': 'Академические источники',
    'official': 'Официальные источники'
  };

  for (const [category, sources] of Object.entries(categorizedSources)) {
    message += `*${categoryNames[category] || category}:*\n`;
    sources.forEach(source => {
      const reliability = Math.round(source.reliability * 100);
      message += `• ${source.name} (${source.domain}) - ${reliability}% надежности\n`;
    });
    message += '\n';
  }

  message += '_Надежность источника влияет на вес информации при кросс-чеке._';

  await ctx.replyWithMarkdown(message);
}