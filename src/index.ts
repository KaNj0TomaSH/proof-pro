import { createBot } from './bot/index.js';

async function main() {
  try {
    console.log('🤖 Starting Journalist Research Bot...');
    
    const bot = createBot();
    console.log('📱 Bot created successfully');
    
    // Enable graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
    // Clear any existing webhook
    console.log('🔧 Clearing webhook...');
    await bot.telegram.setWebhook('');
    
    // Start polling
    console.log('🚀 Starting polling...');
    bot.startPolling(30, 100, ['message', 'callback_query']);
    
    console.log('✅ Bot is running!');
    console.log('👉 Find it at: https://t.me/proofpro_bot');
    console.log('📌 Username: @proofpro_bot');
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main().catch(console.error);