import * as Postgres from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import * as Supabase from 'https://esm.sh/@supabase/supabase-js';

import ENV from './vars.ts';
const { DEBUG, APP_NAME, SUPABASE_URL, SUPABASE_DB_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = ENV;

export type SessionType = Supabase.Session;
export type UserType = Supabase.User;

// Create a database pool with ten connections that are lazily established
export const pgCreatePool = (size: number = 3): Pool => {
  return new Postgres.Pool(SUPABASE_DB_URL, size);
};

export const pgCreateClient = (): Client => {
  return new Postgres.Client(SUPABASE_DB_URL);
};

export const supabaseCreateClient = (schema: string = 'public') => {
  const options = {
    db: { schema },
    headers: { 'x-app-name': APP_NAME },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  };
  return Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
};

export const supabaseAdminClient = Supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const supabaseClient = supabaseCreateClient();
