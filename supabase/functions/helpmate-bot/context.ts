import {Api, Context, NextFunction, SessionFlavor} from 'https://deno.land/x/grammy@v1.16.0/mod.ts';
import {HydrateApiFlavor, HydrateFlavor} from 'https://deno.land/x/grammy_hydrate@v1.3.1/mod.ts';
import ShortUniqueId from 'https://esm.sh/short-unique-id';
import type { Session } from './types';
import ENV from './vars.ts';
const { DEBUG } = ENV;

const uid = new ShortUniqueId();

// Install session middleware, and define the initial session value.
export const SessionInit = (): Session => {
  return {
    id: 0,
    uid: uid.stamp(32), // uid.parseStamp(uidWithTimestamp);
    type: 'private',
  };
};

export const SessionSave = async (ctx: Context, next: NextFunction): Promise<void> => {
  if (DEBUG) console.log(ctx.session);
  ctx.session.id = Number(ctx.chat?.id || ctx.from?.id);
  ctx.session.uid = String(ctx.session.uid || uid.stamp(32));
  ctx.session.type = String(ctx.chat?.type || (!ctx.from?.is_bot ? 'private' : 'bot'));
  ctx.session.language_code = String(ctx.from?.language_code || 'ru');
  ctx.session.first_name = String(ctx.chat?.first_name || ctx.from?.first_name || '');
  ctx.session.last_name = String(ctx.chat?.last_name || ctx.from?.last_name || '');
  ctx.session.username = String(ctx.chat?.username || ctx.from?.username || '');
  await next();
}

// Flavor the context type to include sessions.
export type HydrateContext = HydrateFlavor<Context> & HydrateApiFlavor<Api>;
export type SessionContext = SessionFlavor<SessionData>;
