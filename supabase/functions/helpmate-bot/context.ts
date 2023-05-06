import {Api, Context, NextFunction, SessionFlavor} from 'https://deno.land/x/grammy@v1.16.0/mod.ts';
import {HydrateApiFlavor, HydrateFlavor} from 'https://deno.land/x/grammy_hydrate@v1.3.1/mod.ts';

// Define the shape of our session.
export interface SessionData {
  id: number;
  type: string;
  language_code: string;
  country: string;
  page?: number;
};

// Install session middleware, and define the initial session value.
export const SessionInit = (): SessionData => {
  return {
    id: 0,
    type: 'private',
    language_code: 'ru',
    country: 'RU',
  };
};

export const SessionSave = (ctx: Context, next: NextFunction): Promise<void> => {
  ctx.session.id = Number(ctx.chat?.id || ctx.from?.id);
  ctx.session.type = String(ctx.chat?.type || (!ctx.from?.is_bot && 'private'));
  ctx.session.language_code = String(ctx.from?.language_code || 'ru');
  next();
}

// Flavor the context type to include sessions.
export type HydrateContext = HydrateFlavor<Context> & HydrateApiFlavor<Api>;
export type SessionContext = SessionFlavor<SessionData>;
