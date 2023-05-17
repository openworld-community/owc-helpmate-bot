# owc-helpmate-bot

Try it out: https://t.me/HelpmateRobot

Deploy description: https://grammy.dev/hosting/supabase.html

Supabase CLI setup: https://supabase.com/docs/guides/cli

# Supabase project setup (Replacing `<...>` with respective values):

supabase login

supabase link --project-ref cxopfnqvgblflivwrubv

supabase secrets set --env-file ./.env

supabase secrets list

# open link:

https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://cxopfnqvgblflivwrubv.functions.supabase.co/helpmate-bot?secret=cxopfnqvgblflivwrubv

# Local check (need Deno installed):

deno run --allow-net --allow-read --allow-env --import-map ./supabase/functions/import_map.json ./supabase/functions/helpmate-bot/index.ts
