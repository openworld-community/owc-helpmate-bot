import { Api, Context, NextFunction, SessionFlavor } from 'grammy';
import { HydrateApiFlavor, HydrateFlavor } from 'grammy_hydrate';
import { FluentContextFlavor } from 'grammyfluent';
import ShortUniqueId from 'short-unique-id';
import { toUUID, fromUUID } from '$lib/utils.ts';
import type { Session, UserData } from '$lib/types.ts';

import ENV from '$lib/vars.ts';
const { DEBUG, DEFAULT_LANG = 'en' } = ENV;

const uid = new ShortUniqueId({ length: 32 });

// Install session middleware, and define the initial session value.
export const SessionInit = (): Session => {
  return {
    uid: toUUID(uid.stamp(32)), // uid.parseStamp(fromUUID(uidWithTimestamp))
  };
};

export const SessionSave = async (ctx: Context, next: NextFunction): Promise<void> => {
  if (DEBUG) console.log('ctx.session:', ctx.session);

  const user: UserData = {
    id: Number(ctx.chat?.id || ctx.from?.id),
    phone: String(ctx.chat?.phone || ctx.from?.phone || ''),
    first_name: String(ctx.chat?.first_name || ctx.from?.first_name || ''),
    last_name: String(ctx.chat?.last_name || ctx.from?.last_name || ''),
    username: String(ctx.chat?.username || ctx.from?.username || ''),
    language_code: String(ctx.from?.language_code || DEFAULT_LANG),
  };

  ctx.session.uid = ctx.session.uid || toUUID(uid.stamp(32));
  ctx.session.type = String(ctx.chat?.type || (!ctx.from?.is_bot ? 'private' : 'bot'));
  ctx.session.user = user;
  await next();
};

// Flavor the context type to include sessions.
export type HydrateContext = HydrateFlavor<Context> & HydrateApiFlavor<Api>;
export type SessionContext = SessionFlavor<Session> & FluentContextFlavor;
export type BotContext = HydrateContext & SessionContext;
