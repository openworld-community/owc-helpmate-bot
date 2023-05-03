import { initBot } from './bot.ts';
import { serve } from 'https://deno.land/std@0.185.0/http/server.ts';
import ENV from './vars.ts';
const { DEBUG, APP_NAME, TELEGRAM_BOT_SECRET, ADMIN_IDS } = ENV;

console.info(`Bot "${APP_NAME}" up and running!`);

try {
  const { bot, handleUpdate } = initBot();

  if (!!TELEGRAM_BOT_SECRET) {
    serve(async (req) => {
      try {
        const url = new URL(req.url);
        if (url.searchParams.get('secret') !== TELEGRAM_BOT_SECRET) {
          return new Response('405 Not allowed', { status: 405 });
        }
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
        return new Response(String(err?.message ?? err), { status: 500 });
      }
    });
  } else {
    bot.start();
  }

} catch (err) {
  console.error(err);
}
