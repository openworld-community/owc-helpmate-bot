-- select cron.unschedule('cron-function-every-day');
select cron.schedule(
    'cron-function-every-day',
    '0 0 * * *', -- every day
    $$
    select
      net.http_post(
          url:='https://cxopfnqvgblflivwrubv.functions.supabase.co/tgwebapp-cron?secret=cxopfnqvgblflivwrubv&name=cron-function-every-day',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer cxopfnqvgblflivwrubv"}'::jsonb,
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
);
