# helpmate-bot

Try it out: https://t.me/HelpmateRobot

## Deploy

1. Run `supabase functions deploy helpmate-bot --no-verify-jwt`
2. Get your Telegram token from https://t.me/BotFather
3. Run `supabase secrets set TELEGRAM_BOT_TOKEN=your_token TELEGRAM_BOT_SECRET=random_secret`
4. Set your bot's webhook url to `https://<SUPABASE_PROJECT_ID>.functions.supabase.co/helpmate-bot` (Replacing `<...>` with respective values). In order to do that, run this url (in your browser, for example): `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<SUPABASE_PROJECT_ID>.functions.supabase.co/helpmate-bot?secret=<TELEGRAM_BOT_SECRET>`
5. That's it, go ahead and chat with your bot 🤖💬
