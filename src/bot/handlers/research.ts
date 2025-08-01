import { Context } from 'telegraf';
import { ResearchRequest } from '../../types/index.js';
import { ResearchService } from '../../services/research.js';
import { formatResults } from '../../utils/formatter.js';

const researchService = new ResearchService();

export async function handleResearch(ctx: Context) {
  if (!ctx.message || !('text' in ctx.message)) {
    await ctx.reply('Пожалуйста, отправьте текстовое сообщение с вашим запросом.');
    return;
  }

  const query = ctx.message.text;
  const userId = ctx.from?.id || 0;
  const chatId = ctx.chat?.id || 0;

  // Validate query
  if (query.length < 5) {
    await ctx.reply('Запрос слишком короткий. Пожалуйста, опишите тему подробнее.');
    return;
  }

  if (query.startsWith('/')) {
    // This is a command, not a research query
    return;
  }

  const request: ResearchRequest = {
    query,
    userId,
    chatId,
    timestamp: new Date(),
  };

  try {
    // Send initial message
    const processingMessage = await ctx.reply(
      '🔍 Начинаю поиск информации...\n⏳ Это может занять несколько минут.'
    );

    // Update status
    await ctx.telegram.editMessageText(
      chatId,
      processingMessage.message_id,
      undefined,
      '🔍 Поиск информации...\n📊 Анализирую источники...'
    );

    // Perform research
    const results = await researchService.performResearch(request);

    // Update status
    await ctx.telegram.editMessageText(
      chatId,
      processingMessage.message_id,
      undefined,
      '✅ Анализ завершен!\n📝 Формирую отчет...'
    );

    // Format and send results
    const formattedResults = formatResults(results);
    
    // Split message if too long
    const chunks = splitMessage(formattedResults);
    
    for (const chunk of chunks) {
      await ctx.replyWithMarkdown(chunk, {
        // @ts-ignore
        disable_web_page_preview: true,
      });
    }

    // Delete processing message
    await ctx.telegram.deleteMessage(chatId, processingMessage.message_id);

  } catch (error) {
    console.error('Research error:', error);
    await ctx.reply(
      '❌ Произошла ошибка при поиске информации. Пожалуйста, попробуйте позже или переформулируйте запрос.'
    );
  }
}

function splitMessage(text: string, maxLength: number = 4000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}