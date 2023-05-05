//import { freeStorage } from 'https://deno.land/x/grammy_storages@v2.2.0/free/src/mod.ts';
import { Bot, Context, session, SessionFlavor, webhookCallback } from 'https://deno.land/x/grammy@v1.16.0/mod.ts';
import { supabaseClient, supabaseCreateStorage } from './supabase.ts';
import { getFiles } from './bucket.ts';
import ENV from './vars.ts';
const { DEBUG, TELEGRAM_BOT_NAME, TELEGRAM_BOT_TOKEN, ADMIN_IDS } = ENV;

console.info('TELEGRAM_BOT_NAME:', TELEGRAM_BOT_NAME, 'ADMIN_IDS:', ADMIN_IDS);

// Define the shape of our session.
interface SessionData {
  type: string;
  country: string;
};

// Flavor the context type to include sessions.
type BotContext = Context & SessionFlavor<SessionData>;

export const initBot = () => {
  const bot = new Bot<BotContext>(TELEGRAM_BOT_TOKEN);

  // Install session middleware, and define the initial session value.
  const initial = (): SessionData => {
    return {
      type: 'user',
      country: 'RU',
    };
  }
  const storage = supabaseCreateStorage(); // freeStorage<SessionData>(bot.token);
  bot.use(session({ initial, storage }));

  bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'));
  bot.command('ping', (ctx) => {
    const country = ctx.session.country;
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

  ADMIN_IDS.forEach(aid => {
    bot.api.sendMessage(aid, `The @${TELEGRAM_BOT_NAME} bot initialized!`);
  });

  return {
    bot,
    handleUpdate: webhookCallback(bot, 'std/http'),
  };
};
