// not allowed at supabase functions deploy
//import { load } from 'https://deno.land/std@0.185.0/dotenv/mod.ts';

const ENV = (typeof load !== 'undefined') ? (await load()) : {};
const APP_NAME = Deno.env.get('APP_NAME') || ENV['APP_NAME'];
const TELEGRAM_BOT_NAME = Deno.env.get('TELEGRAM_BOT_NAME') || ENV['TELEGRAM_BOT_NAME'];
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ENV['TELEGRAM_BOT_TOKEN'];
const TELEGRAM_BOT_SECRET = Deno.env.get('TELEGRAM_BOT_SECRET') || ENV['TELEGRAM_BOT_SECRET'];

import { serve } from 'https://deno.land/std@0.185.0/http/server.ts';
import { Bot, webhookCallback } from 'https://deno.land/x/grammy/mod.ts';

console.log(`Bot "${APP_NAME}" up and running!`);
console.log('TELEGRAM_BOT_NAME:', TELEGRAM_BOT_NAME, 'TELEGRAM_BOT_SECRET:', TELEGRAM_BOT_SECRET);

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'));
bot.command('ping', (ctx) => ctx.reply(`Pong! ${new Date()} ${Date.now()}`));
bot.on('message:text', (ctx) => ctx.reply('That is text and not a photo!'));
bot.on('message:photo', (ctx) => ctx.reply('Nice photo! Is that you?'));
bot.on('edited_message', (ctx) => ctx.reply('Ha! Gotcha! You just edited this!', { reply_to_message_id: ctx.editedMessage.message_id }));

if (!!TELEGRAM_BOT_SECRET) {
  const handleUpdate = webhookCallback(bot, 'std/http');
  serve(async (req) => {
    try {
      const url = new URL(req.url);
      if (url.searchParams.get('secret') !== TELEGRAM_BOT_SECRET) {
        return new Response('405 Not allowed', { status: 405 });
      }
      return await handleUpdate(req);
    } catch (err) {
      console.error(err);
    }
  });
} else {
  bot.start();
}
