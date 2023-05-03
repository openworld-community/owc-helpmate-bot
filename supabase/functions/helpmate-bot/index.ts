import { supabaseClient } from './supabase.ts';
import { serve } from 'https://deno.land/std@0.185.0/http/server.ts';
import { Bot, webhookCallback } from 'https://deno.land/x/grammy@v1.16.0/mod.ts';

import ENV from './vars.ts';
const { DEBUG, APP_NAME, TELEGRAM_BOT_NAME, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_SECRET, SUPABASE_DB_URL } = ENV;

try {
  console.log(`Bot "${APP_NAME}" up and running!`);
  console.log('TELEGRAM_BOT_NAME:', TELEGRAM_BOT_NAME, 'TELEGRAM_BOT_SECRET:', TELEGRAM_BOT_SECRET);

  const bot = new Bot(TELEGRAM_BOT_TOKEN);

  bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'));
  bot.command('ping', (ctx) => ctx.reply(`Pong! ${new Date()} ${Date.now()}`));
  bot.command('help', (ctx) => {
      ctx.reply(`
      The @${TELEGRAM_BOT_NAME} bot could greet people in different languages.
      The list of supported greetings:
      - hello - English
      - salut - French
      - hola - Spanish
      `);
  });

  bot.hears('salut', (ctx) => ctx.reply('salut'));
  bot.hears('hello', (ctx) => ctx.reply('hello'));
  bot.hears('hola', (ctx) => ctx.reply('hola'));

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
        return new Response(String(err?.message ?? err), { status: 500 })
      }
    });
  } else {
    bot.start();
  }

} catch (err) {
  console.error(err);
} finally {
  //await pgClient.end();
}
