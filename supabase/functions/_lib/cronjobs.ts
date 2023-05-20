import Cron from 'croner';

import ENV from './vars.ts';
const { DEBUG, CRON_NAME, CRON_INTERVAL, CRON_WEBHOOK, CRON_SECRET } = ENV;

export type CronjobSql = string;

export interface CronjobView {
  name: string;
  interval: string;
  sql: string;
};

export type Cronjob = CronjobView | CronjobSql;

export const createHttpSql = (url: string, body: string = '', headers: string = '{"Content-Type": "application/json"}', method: string = 'post'): string => {
  return `select
    net.http_${method}(
        url:='${url}',
        headers:='${headers}'::jsonb,
        body:='${body}'::jsonb
    ) as request_id`;
};

export const createHttpCronjob = (name: string = CRON_NAME, interval: string = CRON_INTERVAL, webhook: string = CRON_WEBHOOK, body: string = `{"time": "${new Date}"}`, headers: string = `{"Content-Type": "application/json", "Authorization": "Bearer ${CRON_SECRET}"}`, method: string = 'post'): CronjobView => {
  return {
    name,
    interval,
    sql: createHttpSql(`${webhook}&name=${name}`, body, headers, method),
  };
};

export const createRawCronjob = (name: string, interval: string, sql: string): CronjobView => {
  return {
    name,
    interval,
    sql,
  };
};

export const createCronjobSql = (cronjob: CronjobView): CronjobSql => {
  const nextJob = Cron(cronjob.interval).enumerate(1);
  if (DEBUG) console.log(nextJob);
  return `select
    cron.schedule(
      '${cronjob.name}',
      '${cronjob.interval}',
      $$ ${cronjob.sql} $$
    )
  ;`
};

/*

select cron.schedule (
    'saturday-cleanup', -- name of the cron job
    '30 3 * * 6', -- Saturday at 3:30am (GMT)
    $$ delete from events where event_time < now() - interval '1 week' $$
);
select cron.unschedule('saturday-cleanup');
*/
