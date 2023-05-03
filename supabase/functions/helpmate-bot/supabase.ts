import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import * as Supabase from 'https://esm.sh/@supabase/supabase-js';

import ENV from './vars.ts';
const { DEBUG, APP_NAME, SUPABASE_URL, SUPABASE_DB_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = ENV;

export type SessionType = Supabase.Session;
export type UserType = Supabase.User;

export const pgCreateClient = async (): Promise<Client> => {
  const pgClient = new Client(SUPABASE_DB_URL);
  await pgClient.connect();
  return pgClient;
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
