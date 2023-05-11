import { Keyboard, InlineKeyboard, Bot, Context, session, webhookCallback } from 'https://deno.land/x/grammy@v1.16.0/mod.ts';
import { ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup } from 'https://deno.land/x/grammy_types@v3.1.1/mod.ts';
import { Menu } from 'https://deno.land/x/grammy_menu@v1.2.0/mod.ts';
import { hydrateApi, hydrateContext } from 'https://deno.land/x/grammy_hydrate@v1.3.1/mod.ts';
import { I18n, I18nFlavor } from 'https://deno.land/x/grammy_i18n@v1.0.1/mod.ts';
import { SessionInit, SessionSave, SessionContext, HydrateContext } from './context.ts';
import { supabaseClient, supabaseCreateStorage } from './supabase.ts';
import { getFiles } from './bucket.ts';
import ENV from './vars.ts';
const { DEBUG, TELEGRAM_BOT_SECRET, TELEGRAM_BOT_NAME, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_WEBAPP, ADMIN_IDS } = ENV;

console.info('TELEGRAM_BOT_NAME:', TELEGRAM_BOT_NAME, 'ADMIN_IDS:', ADMIN_IDS);

type ButtonArray = KeyboardButton[];
type ButtonMatrix = ButtonArray[];
type InlineButton = {
  type: string;
  label: string;
  action: string;
  row?: boolean;
}

const makeKeyboardButton = (qry: string = '', text: string = TELEGRAM_BOT_NAME): KeyboardButton => {
  const url = `${TELEGRAM_BOT_WEBAPP}${qry}`;
  return {
    text,
    web_app: { url }
  };
};

const makeInlineKeyboard = (inlineButtons: InlineButton[]): InlineKeyboard => {
  const inlineKeyboard = new InlineKeyboard();
  inlineButtons.forEach(el => {
    inlineKeyboard[el.type](el.label, el.action);
    if (el.row) inlineKeyboard.row();
  });
  return inlineKeyboard;
};

const makeInlineMenu = (inlineButtons: InlineButton[], menuId: string = 'menuId'): Menu => {
  const inlineMenu = new Menu<HydrateContext, SessionContext>(menuId);
  inlineButtons.forEach(el => {
    inlineMenu[el.type](el.label, el.action);
    if (el.row) inlineKeyboard.row();
  });
  return inlineMenu;
};

const makeInlineKeyboardMarkup = (inline_keyboard: ButtonMatrix): InlineKeyboardMarkup => { inline_keyboard };

const makeKeyboardMarkup = (keyboard: ButtonMatrix, one_time_keyboard: boolean = true, is_persistent: boolean = false): ReplyKeyboardMarkup => { keyboard, one_time_keyboard, is_persistent };

const removeKeyboardMarkup = (remove_keyboard: boolean = true): ReplyKeyboardMarkup => { remove_keyboard };

const keyboardButton: KeyboardButton = makeKeyboardButton();

const keyboardMarkup: ReplyKeyboardMarkup = makeKeyboardMarkup([[keyboardButton]]);

export const initBot = () => {
  const bot = new Bot<HydrateContext, SessionContext>(TELEGRAM_BOT_TOKEN);

  bot.api.config.use(hydrateApi());
  bot.use(hydrateContext());
  bot.use(session({ initial: SessionInit, storage: supabaseCreateStorage() })); // freeStorage<Session>(bot.token);
  bot.use(SessionSave);

  const showInlineKeyboard = async (ctx) => {
    const webQry = `?id=${ctx.session.id}&uid=${ctx.session.uid}`;
    const webApp = TELEGRAM_BOT_WEBAPP+webQry;
    const webURL = DEBUG ? `http://127.0.0.1:3003/${webQry}` : webApp;

    const inlineButtons: InlineButton[] = [
      { type: 'text', label: 'inline action', action: 'click-payload' },
      { type: 'webApp', label: 'inline webapp', action: webApp },
      { type: 'url', label: 'online website', action: webURL },
    ];

    const inlineKeyboard = makeInlineKeyboard(inlineButtons);

    await ctx.reply('Hello!', { reply_markup: removeKeyboardMarkup() });
    await ctx.reply('Choose options:', { reply_markup: inlineKeyboard });
  };

  bot.callbackQuery('click-payload', async (ctx) => {
    await ctx.answerCallbackQuery('Inline action done!');
  });

  bot.on('callback_query', async (ctx) => {
    if (DEBUG) console.log('ctx.callbackQuery:', ctx.callbackQuery);
    await ctx.answerCallbackQuery(); // remove loading animation
  });

  // Return empty result list for other queries.
  //bot.on('inline_query', (ctx) => ctx.answerInlineQuery([]));

  bot.command('start', (ctx) => showInlineKeyboard(ctx));

  bot.command('menu', (ctx) => showInlineKeyboard(ctx));

  bot.command('ping', (ctx) => {
    const country = ctx.session?.country || '';
    ctx.reply(`Pong! ${new Date()} ${Date.now()} selected country: ${country}`);
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

  bot.on('message:text', (ctx) => ctx.reply(`
    That is text and not a photo!
    ${JSON.stringify(ctx.msg,null,2)}
  `));
  bot.on('message:photo', (ctx) => ctx.reply('Nice photo! Is that you?'));
  bot.on('edited_message', (ctx) => ctx.reply('Ha! Gotcha! You just edited this!', { reply_to_message_id: ctx.editedMessage.message_id }));

  ADMIN_IDS.forEach(aid => {
    bot.api.sendMessage(aid, `The @${TELEGRAM_BOT_NAME} bot initialized!`);
  });

  return {
    bot,
    handleUpdate: webhookCallback(bot, 'std/http'),
  };
};
