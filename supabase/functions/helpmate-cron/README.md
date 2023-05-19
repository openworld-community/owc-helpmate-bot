# helpmate-cron

## Deploy

1. Run `supabase functions deploy helpmate-cron --no-verify-jwt --import-map ./supabase/functions/import_map.json`
2. Run `supabase secrets set CRON_SECRET=random_secret`
3. Set your cron's webhook url to `https://<SUPABASE_PROJECT_ID>.functions.supabase.co/helpmate-cron?secret=<CRON_SECRET>&name=<CRON_NAME>` (Replacing `<...>` with respective values).
