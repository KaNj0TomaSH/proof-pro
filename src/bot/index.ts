import { Telegraf } from 'telegraf';
import { config, validateConfig } from '../config/index.js';
import { handleStart, handleHelp, handleSources, handleResearch } from './handlers/index.js';

export function createBot() {
  validateConfig();
  
  console.log('🔑 Creating bot with token:', config.telegram.token.substring(0, 10) + '...');
  const bot = new Telegraf(config.telegram.token);

  // Register command handlers
  bot.command('start', (ctx) => {
    console.log('📨 Received /start command from:', ctx.from?.username || ctx.from?.id);
    return handleStart(ctx);
  });
  bot.command('help', handleHelp);
  bot.command('sources', handleSources);

  // Handle text messages as research requests
  bot.on('text', (ctx) => {
    console.log('📝 Received text message:', ctx.message.text);
    return handleResearch(ctx);
  });

  // Error handling
  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.');
  });

  console.log('✅ Bot handlers registered');
  return bot;
}