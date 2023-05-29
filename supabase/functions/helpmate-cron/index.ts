import { serve } from 'http/server';

import ENV from '$lib/vars.ts';
const { DEBUG, APP_NAME, SMTP_NOTIFY, CRON_SECRET, ADMIN_IDS, TELEGRAM_BOT_SEND_MESSAGE } = ENV;

console.info(`Cron "${APP_NAME}" up and running!`);

const sendMessage = async (message, contentType = 'application/json', method = 'post') => {
  if (!!!TELEGRAM_BOT_SEND_MESSAGE) return `{"ok": false, "error": "add 'TELEGRAM_BOT_SEND_MESSAGE' secret!"}`;
  return await (await fetch(TELEGRAM_BOT_SEND_MESSAGE, {
    method,
    headers: {
      'Accept': contentType,
      'Content-Type': contentType,
    },
    body: JSON.stringify(message),
  })).json();
};

const notifyAdmins = async (text = `Cronjob is done at ${new Date}`): Promise<any[]> => {
  const results = [];
  for (let i=0;i<ADMIN_IDS.length;i++) {
    results.push(await sendMessage({ chat_id: ADMIN_IDS[i], text }));
  }
  return results;
};

try {
  if (!!CRON_SECRET) {
    serve(async (req) => {
      try {
        const url = new URL(req.url);
        if (url.searchParams.get('secret') !== CRON_SECRET) {
          return new Response('405 Not allowed', { status: 405 });
        }
        const name = url.searchParams.get('name') || '';
        const text = `Cronjob '${name}' is done at ${new Date}`;
        const results = await notifyAdmins(text);
        return new Response(JSON.stringify(results,null,2), { status: 200, headers: { 'Content-Type': 'application/json' }})
      } catch (err) {
        console.error(err);
        return new Response(String(err?.message ?? err), { status: 500 });
      }
    });
  }
} catch (err) {
  console.error(err);
}
