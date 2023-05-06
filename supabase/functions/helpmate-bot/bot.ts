import { Keyboard, InlineKeyboard, Bot, Context, session, webhookCallback } from 'https://deno.land/x/grammy@v1.16.0/mod.ts';
import { ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton } from 'https://deno.land/x/grammy_types@v3.1.1/mod.ts';
import { hydrateApi, hydrateContext } from 'https://deno.land/x/grammy_hydrate@v1.3.1/mod.ts';
import { I18n, I18nFlavor } from 'https://deno.land/x/grammy_i18n@v1.0.1/mod.ts';
import { SessionData, SessionInit, SessionSave, SessionContext, HydrateContext } from './context.ts';
import { supabaseClient, supabaseCreateStorage } from './supabase.ts';
import { getFiles } from './bucket.ts';
import ENV from './vars.ts';
const { DEBUG, TELEGRAM_BOT_NAME, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_WEBAPP, ADMIN_IDS } = ENV;

console.info('TELEGRAM_BOT_NAME:', TELEGRAM_BOT_NAME, 'ADMIN_IDS:', ADMIN_IDS);

export const initBot = () => {
  const bot = new Bot<Context, HydrateContext, SessionContext>(TELEGRAM_BOT_TOKEN);

  bot.api.config.use(hydrateApi());
  bot.use(hydrateContext());
  bot.use(session({ initial: SessionInit, storage: supabaseCreateStorage() })); // freeStorage<SessionData>(bot.token);
  bot.use(SessionSave);

  const keyboardButton: KeyboardButton = {
    text: TELEGRAM_BOT_NAME,
    web_app: { url: TELEGRAM_BOT_WEBAPP }
  };

  const inlineKeyboardMarkup: InlineKeyboardMarkup = {
    inline_keyboard: [[keyboardButton]]
  };

  const keyboardMarkup: ReplyKeyboardMarkup = {
    keyboard: [[keyboardButton]],
    is_persistent: false,
  }

  //const inlineKeyboard = new InlineKeyboard();
  //inlineKeyboard.text('click', 'click-payload');

  bot.callbackQuery('click-payload', async (ctx) => {
    await ctx.answerCallbackQuery('You were curious, indeed!');
  });

  bot.on('callback_query:data', async (ctx) => {
    console.log('Unknown button event with payload', ctx.callbackQuery.data);
    await ctx.answerCallbackQuery(); // remove loading animation
  });

  bot.command('inline', async (ctx) => {
    await ctx.reply('/inline WebApp:', { reply_markup: inlineKeyboardMarkup });
  });

  bot.command('start', async (ctx) => {
    await ctx.reply('/inline WebApp:', { reply_markup: inlineKeyboardMarkup });
  });

  bot.command('menu', async (ctx) => {
    await ctx.reply('Menu:', { reply_markup: keyboardMarkup });
  });

  bot.command('ping', (ctx) => {
    const country = ctx.session?.country;
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

  //bot.hears(/echo *(.+)?/, (ctx) => {/* ... */});

  bot.on('message:text', (ctx) => ctx.reply(`
    That is text and not a photo!
    ${JSON.stringify(ctx.msg,null,2)}
  `));
  bot.on('message:photo', (ctx) => ctx.reply('Nice photo! Is that you?'));
  bot.on('edited_message', (ctx) => ctx.reply('Ha! Gotcha! You just edited this!', { reply_to_message_id: ctx.editedMessage.message_id }));

  const showInlineMenu = async (ctx) => {
    await ctx.answerInlineQuery(
      [
        {
          type: "article",
          id: "grammy-website",
          title: "grammY",
          input_message_content: {
            message_text:
  "<b>grammY</b> is the best way to create your own Telegram bots. \
  They even have a pretty website! 👇",
            parse_mode: "HTML",
          },
          reply_markup: new InlineKeyboard().url(
            "grammY website",
            "https://grammy.dev/",
          ),
          url: "https://grammy.dev/",
          description: "The Telegram Bot Framework.",
        },
      ],
      { cache_time: 30 * 24 * 3600 }, // one month in seconds
    );
  };

  //bot.command('menu', (ctx) => showInlineMenu(ctx));
  //bot.hears(/best*(.+)?/, (ctx) => showInlineMenu(ctx));
  //bot.inlineQuery(/best*(.+)?/, (ctx) => showInlineMenu(ctx));

  // Return empty result list for other queries.
  //bot.on('inline_query', (ctx) => ctx.answerInlineQuery([]));

  ADMIN_IDS.forEach(aid => {
    bot.api.sendMessage(aid, `The @${TELEGRAM_BOT_NAME} bot initialized!`);
  });

  return {
    bot,
    handleUpdate: webhookCallback(bot, 'std/http'),
  };
};
