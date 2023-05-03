// not allowed at supabase functions deploy
//import { load } from 'https://deno.land/std@0.185.0/dotenv/mod.ts';

const ENV = (typeof load !== 'undefined') ? (await load()) : {};
export const NODE_ENV: string = ENV.NODE_ENV || '';
export const DEV_MODE: boolean = NODE_ENV.indexOf('dev') > -1;
export const DEBUG: boolean = !!DEV_MODE;
export const APP_NAME: string = Deno.env.get('APP_NAME') || ENV['APP_NAME'];
export const TELEGRAM_BOT_NAME: string = Deno.env.get('TELEGRAM_BOT_NAME') || ENV['TELEGRAM_BOT_NAME'];
export const TELEGRAM_BOT_TOKEN: string = Deno.env.get('TELEGRAM_BOT_TOKEN') || ENV['TELEGRAM_BOT_TOKEN'];
export const TELEGRAM_BOT_SECRET: string = Deno.env.get('TELEGRAM_BOT_SECRET') || ENV['TELEGRAM_BOT_SECRET'];
export const SUPABASE_URL: string = Deno.env.get('SUPABASE_URL') || ENV['SUPABASE_URL'];
export const SUPABASE_DB_URL: string = Deno.env.get('SUPABASE_DB_URL') || ENV['SUPABASE_DB_URL'];
export const SUPABASE_JWT_SECRET: string = Deno.env.get('SUPABASE_JWT_SECRET') || ENV['SUPABASE_JWT_SECRET'];
export const SUPABASE_ANON_KEY: string = Deno.env.get('SUPABASE_ANON_KEY') || ENV['SUPABASE_ANON_KEY'];
export const SUPABASE_SERVICE_ROLE_KEY: string = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ENV['SUPABASE_SERVICE_ROLE_KEY'];
