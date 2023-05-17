import { SupabaseAdapter } from 'grammy_storage_supabase';
import * as Postgres from 'postgres';
import * as Supabase from '@supabase/supabase-js';

import ENV from './vars.ts';
const { DEBUG, APP_NAME, SUPABASE_URL, SUPABASE_DB_URI, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = ENV;

export type SessionType = Supabase.Session;
export type UserType = Supabase.User;
const { createClient } = Supabase;
const { Pool, Client } = Postgres;

// Create a database pool with ten connections that are lazily established
export const pgCreatePool = (size: number = 3): Pool => {
  return new Pool(SUPABASE_DB_URI, size);
};

export const pgCreateClient = (): Client => {
  return new Client(SUPABASE_DB_URI);
};

export const supabaseCreateClient = (schema: string = 'public') => {
  const options = {
    db: { schema },
    headers: { 'x-app-name': APP_NAME },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  };
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
};

export const supabaseCreateStorage = (table: string = 'bot_sessions') => {
  return SupabaseAdapter({
    supabase: supabaseCreateClient(),
    table,
  });
};

export const supabaseClient = supabaseCreateClient();

export const supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
