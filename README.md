# owc-helpmate-bot

Try it out: https://t.me/HelpmateRobot

Deploy description: https://grammy.dev/hosting/supabase.html

Supabase CLI setup: https://supabase.com/docs/guides/cli

# Supabase project setup (Replacing `<...>` with respective values):

supabase login

supabase link --project-ref <SUPABASE_PROJECT_ID>

supabase secrets set --env-file ./.env

supabase secrets list

# Local check (need Deno installed):

deno run --allow-net --allow-read --allow-env ./supabase/functions/helpmate-bot/index.ts
