import { serve } from 'http/server';
import { initBot } from './bot.ts';

import ENV from './vars.ts';
const { DEBUG, APP_NAME, TELEGRAM_BOT_SECRET } = ENV;

console.info(`Bot "${APP_NAME}" up and running!`);

try {
  const { bot, handleUpdate } = await initBot();

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
    if (DEBUG) console.log(`Bot started.`);
    bot.start();
  }

} catch (err) {
  console.error(err);
}
