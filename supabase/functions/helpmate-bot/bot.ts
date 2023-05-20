import { Context, Keyboard, InlineKeyboard, Bot, MemorySessionStorage, session, webhookCallback } from 'grammy';
import { ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup } from 'grammy_types';
import { type ChatMember } from 'grammy-types';
import { chatMembers } from 'grammy_chat_members';
import { hydrateApi, hydrateContext } from 'grammy_hydrate';
import { useFluent, Fluent } from 'grammyfluent';
import { SessionInit, SessionSave, BotContext, getLocale, setLocale, syncLocale } from './context.ts';
import { supabaseClient, supabaseCreateStorage } from '$lib/supabase.ts';
import { locales } from '$lib/locales.ts';
import type { Lang, UserData } from '$lib/types.ts';

import ENV from '$lib/vars.ts';
const { DEBUG, TELEGRAM_BOT_SECRET, TELEGRAM_BOT_NAME, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_WEBAPP, ADMIN_IDS, DEFAULT_LANG = 'en' } = ENV;

console.info('TELEGRAM_BOT_NAME:', TELEGRAM_BOT_NAME, 'ADMIN_IDS:', ADMIN_IDS, 'DEFAULT_LANG:', DEFAULT_LANG);

type InlineButton = {
  type: string;
  label: string;
  action: string;
  row?: boolean;
};
//type ButtonArray = KeyboardButton[];
//type ButtonMatrix = ButtonArray[];

const makeKeyboardMarkup = (keyboard: ButtonMatrix, one_time_keyboard: boolean = true, is_persistent: boolean = false): ReplyKeyboardMarkup => { keyboard, one_time_keyboard, is_persistent };
const removeKeyboardMarkup = (remove_keyboard: boolean = true): ReplyKeyboardMarkup => { remove_keyboard };
const makeInlineKeyboardMarkup = (inline_keyboard: ButtonMatrix): InlineKeyboardMarkup => { inline_keyboard };
const makeKeyboardButton = (qry: string = '', text: string = TELEGRAM_BOT_NAME): KeyboardButton => {
  const url = `${TELEGRAM_BOT_WEBAPP}${qry}`;
  return {
    text,
    web_app: { url }
  };
};

const keyboardButton: KeyboardButton = makeKeyboardButton();
const keyboardMarkup: ReplyKeyboardMarkup = makeKeyboardMarkup([[keyboardButton]]);

const makeInlineKeyboard = (inlineButtons: InlineButton[]): InlineKeyboard => {
  const inlineKeyboard = new InlineKeyboard();
  inlineButtons.forEach(el => {
    inlineKeyboard[el.type](el.label, el.action);
    if (el.row) inlineKeyboard.row();
  });
  return inlineKeyboard;
};

const showInlineKeyboard = async (ctx: Context) => {
  const user: UserData = ctx.session.user;
  if (!!!user?.id) return;

  const webQry = `?uid=${user.uid}&lang=${user.lang}`;
  const webApp = `${TELEGRAM_BOT_WEBAPP}${webQry}`;
  const webURL = DEBUG ? `http://127.0.0.1:3003/${webQry}` : webApp;

  const inlineButtons: InlineButton[] = [
    //{ type: 'text', label: ctx.t('action'), action: 'click-payload' },
    { type: 'webApp', label: ctx.t('webapp'), action: `${webApp}&mode=app` },
    { type: 'url', label: ctx.t('website'), action: webURL },
  ];

  const inlineKeyboard = makeInlineKeyboard(inlineButtons);

  //await ctx.reply('Hello!', { reply_markup: removeKeyboardMarkup() });
  await ctx.reply(ctx.t('menu'), { reply_markup: inlineKeyboard });
};

export const initBot = async () => {
  const bot = new Bot<BotContext>(TELEGRAM_BOT_TOKEN);

  const memorySessionAdapter = new MemorySessionStorage<ChatMember>();

  const fluent = new Fluent();
  for (let lang of Object.keys(locales)) {
    const source = Object.keys(locales[lang]).map(cmd=>`${cmd} = ${locales[lang][cmd]}`).join('\n');
    await fluent.addTranslation({
      locales: lang,
      source,
      // All the aspects of Fluent are highly configurable:
      bundleOptions: {
        // Use this option to avoid invisible characters around placeables.
        useIsolating: false,
      },
    });
  }

  bot.api.config.use(hydrateApi());
  bot.use(hydrateContext());
  bot.use(chatMembers(memorySessionAdapter));
  bot.use(session({ initial: SessionInit, storage: supabaseCreateStorage() })); // freeStorage<Session>(bot.token);
  bot.use(SessionSave);
  bot.use(useFluent({
    fluent,
    localeNegotiator: (ctx: Context) => ctx.session['__language_code'],
  }));

  bot.command('menu', (ctx: Context) => showInlineKeyboard(ctx));
  bot.command('start', (ctx: Context) => ctx.reply(ctx.t('start')));
  bot.command('help', (ctx: Context) => ctx.reply(ctx.t('help', { locales: Object.keys(locales).join('|') })));
  bot.command('lang', async (ctx: Context) => {
    if (!!!ctx.session.user?.id || Number(ctx.chat.id)<1) return;
    const lang: Lang = ctx.match.trim().toLowerCase();
    if (!!lang) await setLocale(ctx, lang);
    ctx.reply(ctx.t('start'));
  });
  bot.command('ping', (ctx: Context) => {
    ctx.reply(`Pong!
    ${new Date()}
    ${Date.now()}
    `);
  });

  bot.on('message:text', (ctx: Context) => {
    ctx.reply(ctx.t('start'));
    if (ADMIN_IDS.includes(ctx.session?.user?.id)) {
      ctx.reply(`
        ${JSON.stringify(ctx.msg,null,2)}
        ${JSON.stringify(ctx.session,null,2)}
      `);
    }
  });
  bot.on('message:photo', (ctx: Context) => ctx.reply(ctx.t('start')));
  bot.on('edited_message', (ctx: Context) => ctx.reply('Ha! Gotcha! You just edited this!', { reply_to_message_id: ctx.editedMessage.message_id }));

  ADMIN_IDS.forEach(aid => {
    bot.api.sendMessage(aid, `The @${TELEGRAM_BOT_NAME} bot initialized!`);
  });

  return {
    bot,
    handleUpdate: webhookCallback(bot, 'std/http'),
  };
};

/*

  bot.callbackQuery('click-payload', async (ctx) => {
    await ctx.answerCallbackQuery('Inline action done!');
  });
  bot.on('callback_query', async (ctx) => {
    if (DEBUG) console.log('ctx.callbackQuery:', ctx.callbackQuery);
    await ctx.answerCallbackQuery(); // remove loading animation
  });

  bot.command('help', (ctx) => {
      ctx.reply(`
      The @${TELEGRAM_BOT_NAME} bot could greet people in different languages.
      The list of supported greetings:
      - hello - English
      - salut - French
      - hola - Spanish
      `);
  });

  bot.hears('salut', (ctx) => ctx.reply('salut'));
  bot.hears('hello', (ctx) => ctx.reply('hello'));
  bot.hears('hola', (ctx) => ctx.reply('hola'));

  bot.hears(/file*(.+)?/, async (ctx) => {
    const { files, error } = await getFiles('content');
    if (DEBUG) console.log('files:', files);

    if (ADMIN_IDS.includes(ctx.msg.from.id)) {
      ctx.reply(`
        ${JSON.stringify(ctx.msg,null,2)}
        ${JSON.stringify(files,null,2)}
      `);
    }
  });

  //bot.inlineQuery(/best*(.+)?/, (ctx) => showInlineKeyboard(ctx));
  // Return empty result list for other queries.
  //bot.on('inline_query', (ctx) => ctx.answerInlineQuery([]));

  bot.on('message:text', (ctx) => ctx.reply(`
    That is text and not a photo!
    ${JSON.stringify(ctx.msg,null,2)}
  `));
  bot.on('message:photo', (ctx) => ctx.reply('Nice photo! Is that you?'));
  bot.on('edited_message', (ctx) => ctx.reply('Ha! Gotcha! You just edited this!', { reply_to_message_id: ctx.editedMessage.message_id }));



*/
