import { Context } from 'telegraf';
import { formatWelcome } from '../../utils/formatter.js';

export async function handleStart(ctx: Context) {
  await ctx.replyWithMarkdown(formatWelcome(), {
    // @ts-ignore
    disable_web_page_preview: true,
  });
}