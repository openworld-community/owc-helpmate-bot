import { DEBUG, APP_NAME, SUPABASE_URL, SUPABASE_DB_URL, SUPABASE_ANON_KEY } from './vars.ts';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const options = {
  schema: 'public',
  headers: { 'x-app-name': APP_NAME },
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
};

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);

export const pgClient = new Client(SUPABASE_DB_URL);

//await pgClient.connect();
//await pgClient.end();
