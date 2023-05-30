import { Keyboard, InlineKeyboard, Bot, MemorySessionStorage, session, webhookCallback } from 'grammy';
import { Menu, MenuRange } from 'grammy_menu';
import { ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup } from 'grammy_types';
import { type ChatMember } from 'grammy-types';
import { createHash } from 'hash';
import { limit } from 'grammy_ratelimiter';
import { chatMembers } from 'grammy_chat_members';
import { hydrateFiles } from 'grammy_files';
import { hydrateApi, hydrateContext } from 'grammy_hydrate';
import { conversations, createConversation } from 'grammy_conversations';
import { Fluent, useFluent } from 'grammyfluent';
import { BotWorker, distribute, run } from 'grammy_runner';
import { SessionInit, SessionSave, BotContext, BotConversation, getLocale, setLocale, syncLocale } from './context.ts';
import { supabaseClient, supabaseCreateStorage } from '$lib/supabase.ts';
import { getFiles, uploadFile } from '$lib/bucket.ts';
import { isNumeric } from '$lib/utils.ts';
import { locales } from '$lib/locales.ts';
import type { Lang, UserData } from '$lib/types.ts';

import ENV from '$lib/vars.ts';
const { DEBUG, TELEGRAM_BOT_SECRET, TELEGRAM_BOT_NAME, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_WEBAPP, ADMIN_IDS, CHECK_LOCATION, DEFAULT_LANG = 'en' } = ENV;

console.info('TELEGRAM_BOT_NAME:', TELEGRAM_BOT_NAME, 'ADMIN_IDS:', ADMIN_IDS);

const isMember = (chat, user, adminOnly = false) => {
  if (!chat) return null;
  const members = adminOnly ? [].concat(chat.admins) : [].concat(chat.admins,chat.members)
  return (chat.creator === user.id || members.includes(user.id));
};

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

/*
const inlineKeyboard = new InlineKeyboard()
  .text("« 1", "first")
  .text("‹ 3", "prev")
  .text("· 4 ·", "stay")
  .text("5 ›", "next")
  .text("31 »", "last");
*/

const makeInlineKeyboard = (inlineButtons: InlineButton[]): InlineKeyboard => {
  const inlineKeyboard = new InlineKeyboard();
  inlineButtons.forEach(el => {
    if (el.type in inlineKeyboard) inlineKeyboard[el.type](el.label, el.action);
    if (el.row) inlineKeyboard.row();
  });
  return inlineKeyboard;
};

const chatInlineKeyboard = async (ctx: BotContext, actions: string[] = ['register']): Promise<void> => {
  const inlineButtons: InlineButton[] = actions.map(action => {
    const tgURL = `https://t.me/${TELEGRAM_BOT_NAME}?start=${action}_${ctx.chat.id}`;
    return { type: 'url', label: ctx.t(action), action: tgURL };
  });
  const inlineKeyboard = makeInlineKeyboard(inlineButtons);
  await ctx.reply(ctx.t('button'), { reply_markup: inlineKeyboard }); // , reply_to_message_id: ctx.msg.message_id
  await ctx.deleteMessage();
};

const pmInlineKeyboard = async (ctx: BotContext, inviteLink?: string): Promise<void> => {
  const user: UserData = ctx.session.user;
  if (!!!user?.id) return;

  const webQry = `?uid=${user.uid}&lang=${user.lang}`;
  const webApp = `${TELEGRAM_BOT_WEBAPP}${webQry}`;
  const webURL = DEBUG ? `http://127.0.0.1:3003/${webQry}` : webApp;

  const inlineButtons: InlineButton[] = !!ctx.session.user?.helper_in ? [
    { type: 'text', label: ctx.t('tasks'), action: '/tasks', row: true },
    { type: 'text', label: ctx.t('unregister'), action: '/unregister', row: true },
  ] : [
    { type: 'text', label: ctx.t('add'), action: '/add' },
    { type: 'text', label: ctx.t('register'), action: '/register', row: true },
    { type: 'webApp', label: ctx.t('webapp'), action: `${webApp}&mode=app` },
    { type: 'url', label: ctx.t('website'), action: webURL, row: true },
  ];
  if (!!inviteLink) inlineButtons.push({ type: 'url', label: ctx.t('group'), action: inviteLink });
  const inlineKeyboard = makeInlineKeyboard(inlineButtons);
  //await ctx.reply('Hello!', { reply_markup: removeKeyboardMarkup() });
  await ctx.reply(ctx.t('option'), { reply_markup: inlineKeyboard });
  await ctx.deleteMessage();
};

const helpInlineKeyboard = async (ctx: BotContext, showLangs: boolean = false): Promise<void> => {
  const inlineButtons: InlineButton[] = [
    { type: 'text', label: ctx.t('menu'), action: '/start', row: true },
  ];
  if (showLangs)
  for (let lang of Object.keys(locales)) {
    inlineButtons.push({ type: 'text', label: lang, action: '/lang '+lang });
  }
  const inlineKeyboard = makeInlineKeyboard(inlineButtons);
  await ctx.reply(ctx.t('option'), { reply_markup: inlineKeyboard });
  await ctx.deleteMessage();
};

const exitInlineKeyboard = async (ctx: BotContext, desc: string): Promise<void> => {
  const inlineButtons: InlineButton[] = [
    { type: 'text', label: ctx.t('exit'), action: '/exit', row: true },
  ];
  const inlineKeyboard = makeInlineKeyboard(inlineButtons);
  await ctx.reply(desc, { reply_markup: inlineKeyboard });
};

export const uploadBotFile = async (ctx: BotContext): Promise<void> => {
	// Prepare the file for download.
	const { file_id, file_unique_id, file_size, file_path, getUrl } = await ctx.getFile();
	const url = await getUrl();
	const fileBuffer = await (await (await fetch(url)).blob()).arrayBuffer();
	if (fileBuffer) {
		const hash = createHash('md5').update(fileBuffer).toString();
		const [ dir, filename ] = file_path.split('/');
		const { files, error } = await getFiles(dir, hash);
		if (!error && files.length>0) {
			ctx.reply(ctx.t('file_already'));
		} else {
			const { data: upload_data, error: upload_error } = await uploadFile(`${dir}/${hash}-${filename}`, fileBuffer);
			if (!upload_error) {
				const { files: get_files, error: get_error } = await getFiles(dir, hash);
				if (!get_error && get_files.length>0) {
					const file = {
						uid: get_files[0].id,
						name: get_files[0].name,
						file_id,
						file_unique_id,
						file_path,
						file_size,
					}
					const { data: upsert_data, error: upsert_error } = await supabaseClient.from('files').upsert(file).select();
					if (DEBUG) console.log(upsert_data);
				}
				ctx.reply(ctx.t('file_uploaded'));
			} else {
				ctx.reply(ctx.t('file_notuploaded'));
			}
		}
	} else {
    ctx.reply(ctx.t('file_notuploaded'));
  }
};

const registerHelper = async (conversation: BotConversation, ctx: BotContext): Promise<void> => {
  if (DEBUG) console.log('registerHelper ctx.session.user?.id:', ctx.session.user?.id, 'ctx.session.data:', ctx.session.data);
  const chat = ctx.session.data?.chat;
  if (CHECK_LOCATION && chat && (chat.country!==ctx.session.user.country || !isMember(chat, ctx.session.user))) {
    await ctx.reply(ctx.t('member', { chat_title: chat.title, chat_id: String(chat.id) }));
    await ctx.deleteMessage();
    return;
  }
  if (!!chat?.id && !!!ctx.session.user?.helper_in) {
    const { data, error } = await supabaseClient.from('helpers').upsert({ id: ctx.session.user.id, chat: chat.id }).select();
    if (!error && data.length>0) {
      ctx.session.user.helper_in = chat.id;
      await pmInlineKeyboard(ctx); // , chat.invite
    } else {
      await ctx.reply('Error!');
      await ctx.deleteMessage();
    }
  } else {
    await ctx.reply('Ha-ha!');
    await ctx.deleteMessage();
  }
};

const unregisterHelper = async (conversation: BotConversation, ctx: BotContext): Promise<void> => {
  if (DEBUG) console.log('unregisterHelper ctx.session.user?.helper_in:', ctx.session.user?.helper_in, 'ctx.session.data:', ctx.session.data);
  if (!!ctx.session.user?.helper_in) {
    const { error } = await supabaseClient.from('helpers').delete().eq('id', ctx.session.user.id);
    if (!error) {
      ctx.session.user.helper_in = null;
      await pmInlineKeyboard(ctx);
    } else {
      await ctx.reply('Error!');
      await ctx.deleteMessage();
    }
  } else {
    await ctx.reply('Ha-ha!');
    await ctx.deleteMessage();
  }
};

const taskList = async (conversation: BotConversation, ctx: BotContext): Promise<void> => {
  if (DEBUG) console.log('taskList ctx.session.user?.helper_in:', ctx.session.user?.helper_in, 'ctx.session.data:', ctx.session.data);
  if (!!ctx.session.user?.helper_in) {
    const now: Date = new Date;
    const { data, error } = await supabaseClient.from('tasks').select('*').gt('expiry_date', now.toISOString()).eq('chat', ctx.session.user?.helper_in).eq('status', 'open').is('helper', null);
    await ctx.reply(JSON.stringify(data,null,2));
    await pmInlineKeyboard(ctx); // , ctx.session.data?.chat?.invite
  } else {
    await ctx.reply('Ha-ha!');
    await ctx.deleteMessage();
  }
};

const addTask = async (conversation: BotConversation, ctx: BotContext): Promise<void> => {
  let done = false;
  const chat = ctx.session.data?.chat;
  if (CHECK_LOCATION && chat && (chat.country!==ctx.session.user.country || !isMember(chat, ctx.session.user))) {
    await ctx.reply(ctx.t('member', { chat_title: chat.title, chat_id: String(chat.id) }));
    await ctx.deleteMessage();
    return;
  }
  if (chat?.id && ctx.from.id === ctx.session.user.id) {
    while (!done) {
      if (DEBUG) console.log('addTask ctx.session.data:', ctx.session.data);
      await exitInlineKeyboard(ctx, ctx.t('task_description')+"\n "+ctx.t('press_exit'));
      const convCtx = await conversation.waitFor(':text');
      if (DEBUG) console.log('convCtx.msg.text:', convCtx.msg.text);
      if (convCtx.msg.text.startsWith('/exit')) {
        await ctx.reply(ctx.t('bye'));
        await convCtx.deleteMessage();
        return;
      } else if (convCtx.msg.text.length>3) {
        const expiry_date = new Date();
        expiry_date.setDate(expiry_date.getDate() + 1); // plus 1 day
        const { data, error } = await supabaseClient.from('tasks').upsert({ chat: chat.id, profile: ctx.from.id, description: convCtx.msg.text, expiry_date }).select();
        if (!error && data?.length>0) {
          await ctx.reply('Problem added: '+data[0].uid);
          done = true;
        } else {
          await ctx.reply(`Error!`);
        }
      } else {
        await ctx.reply(ctx.t('short_description'));
      }
    }
    await pmInlineKeyboard(ctx);
  } else {
    await ctx.reply('Ha-ha!');
    await ctx.deleteMessage();
  }
};

const getCountry = async (conversation: BotConversation, ctx: BotContext): Promise<object | undefined> => {
  await ctx.reply(ctx.t('request_country'));
  const convCtx = await conversation.waitFor(':text');
  if (DEBUG) console.log('convCtx.msg.text:', convCtx.msg.text);
  if (convCtx.msg.text.startsWith('/exit')) {
    await ctx.reply(ctx.t('bye'));
    await convCtx.deleteMessage();
  } else if (convCtx.msg.text.length===2) {
    const { data, error } = await supabaseClient.from('countries').select('*').eq('code', convCtx.msg.text.toUpperCase());
    if (!error && data?.length>0) {
      await ctx.reply('Country chosen: '+data[0].name);
      return data[0];
    }
  }
};

const getState = async (conversation: BotConversation, ctx: BotContext, country: number): Promise<object | undefined> => {
  await ctx.reply(ctx.t('request_state'));
  const convCtx = await conversation.waitFor(':text');
  if (DEBUG) console.log('convCtx.msg.text:', convCtx.msg.text);
  if (convCtx.msg.text.startsWith('/exit')) {
    await ctx.reply(ctx.t('bye'));
    await convCtx.deleteMessage();
  } else if (convCtx.msg.text.length>0 && convCtx.msg.text!=='-') {
    const { data, error } = await supabaseClient.from('states').select('*').match({ country, 'code': convCtx.msg.text });
    if (!error && data?.length>0) {
      await ctx.reply('State chosen: '+data[0].name);
      return data[0];
    }
  }
};

const getCity = async (conversation: BotConversation, ctx: BotContext, country: number, state?: number): Promise<object | undefined> => {
  await ctx.reply(ctx.t('request_city'));
  const convCtx = await conversation.waitFor(':text');
  if (DEBUG) console.log('convCtx.msg.text:', convCtx.msg.text);
  if (convCtx.msg.text.startsWith('/exit')) {
    await ctx.reply(ctx.t('bye'));
    await convCtx.deleteMessage();
  } else if (convCtx.msg.text.length>0 && convCtx.msg.text!=='-') {
    const { data, error } = await supabaseClient.from('cities').select('*').eq('country', country).ilike('name', '%'+convCtx.msg.text+'%');
    if (!error && data?.length>0) {
      await ctx.reply('City chosen: '+data[0].name);
      return data[0];
    }
  }
};

const updateChat = async (conversation: BotConversation, ctx: BotContext): Promise<void> => {
  if (DEBUG) console.log(ctx.session.data);
  const chat = ctx.session.data?.chat;
  if (!chat || (!chat?.admins?.includes(ctx.from.id) && chat?.creator !== ctx.from.id)) {
    await ctx.reply('Ha-ha!');
    await ctx.deleteMessage();
    return;
  }
  const chatInfo = {
    invite: '',
    country: '',
    state: '',
    city: ''
  };

  await exitInlineKeyboard(ctx, ctx.t('update_start', chat)+"\n "+ctx.t('press_exit'));

  const country = await getCountry(conversation, ctx);
  if (country?.id) {
    chat.country = country.id;
    chatInfo.country = country.name;
  } else {
    await ctx.reply(ctx.t('update_country'));
    return;
  }

  const state = await getState(conversation, ctx, chat.country);
  if (state?.id) {
    chat.state = state.id;
    chatInfo.state = state.name;
  }

  const city = await getCity(conversation, ctx, chat.country, chat.state);
  if (city?.id) {
    chat.city = city.id;
    chatInfo.city = city.name;
  }

  await ctx.reply(`You have added:
    country: ${chatInfo.country}
    state: ${chatInfo.state}
    city: ${chatInfo.city}
    Send "+" (plus) if this is correct.
  `);
  const convCtx = await conversation.waitFor(':text');
  if (convCtx.msg.text==='+') {
    const { data, error } = await supabaseClient.from('chats').update({ updated_at: new Date(), ...chat }).eq('id', chat.id).select();
    if (DEBUG) console.log('updateChat chat update:', update);
    ctx.session.data = {};
    if (!error && data.length>0)
      await ctx.reply('Chat info updated!');
    else
      await ctx.reply('Error updating chat info!');
  } else {
    await ctx.reply(ctx.t('bye'));
  }
  return;
};

export const initBot = async () => {
  const bot = new Bot<BotContext>(TELEGRAM_BOT_TOKEN);

  const notifyAdmins = (text = `The @${TELEGRAM_BOT_NAME} <b>bot initialized</b>!`, options = { parse_mode: 'HTML' }) => {
    ADMIN_IDS.forEach(aid => {
      bot.api.sendMessage(aid, text, options);
    });
  };

  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    console.error('Error in request:', err.error);
  });

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
  bot.api.config.use(hydrateFiles(TELEGRAM_BOT_TOKEN));
  bot.use(hydrateContext());
  bot.use(chatMembers(memorySessionAdapter));
  bot.use(session({ initial: SessionInit, storage: supabaseCreateStorage() })); // freeStorage<Session>(bot.token);
  bot.use(SessionSave);
  bot.use(useFluent({
    fluent,
    localeNegotiator: (ctx: BotContext) => ctx.session['__language_code'] || ctx.session.user?.lang,
  }));
  bot.use(limit());

  bot.use(conversations());
  bot.use(createConversation(taskList, 'tasks'));
  bot.use(createConversation(addTask, 'add'));
  bot.use(createConversation(registerHelper, 'register'));
  bot.use(createConversation(unregisterHelper, 'unregister'));
  bot.use(createConversation(updateChat, 'update'));
  //bot.errorBoundary((err) => console.error('App threw an error!', err),createConversation(register));

  // Only handle commands in private chats.
  const pm = bot.chatType('private');
  pm.callbackQuery('/add', async (ctx: BotContext) => {
    //if (ctx.callbackQuery?.message?.message_id) await bot.api.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('add');
  });
  pm.callbackQuery('/tasks', async (ctx: BotContext) => {
    //if (ctx.callbackQuery?.message?.message_id) await bot.api.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('tasks');
  });
  pm.callbackQuery('/register', async (ctx: BotContext) => {
    //if (ctx.callbackQuery?.message?.message_id) await bot.api.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('register');
  });
  pm.callbackQuery('/unregister', async (ctx: BotContext) => {
    //if (ctx.callbackQuery?.message?.message_id) await bot.api.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('unregister');
  });
  pm.callbackQuery('/unregister', async (ctx: BotContext) => {
    //if (ctx.callbackQuery?.message?.message_id) await bot.api.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('unregister');
  });
  pm.callbackQuery('/menu', (ctx: BotContext) => helpInlineKeyboard(ctx, true));
  pm.callbackQuery('/start', (ctx: BotContext) => pmInlineKeyboard(ctx));
  pm.command('start', async (ctx: BotContext) => {
    const cmd = ctx.match.trim().toLowerCase();
    const cmds = cmd.split('_').filter(el=>!!el);
    if (DEBUG) console.log('/start cmds:', cmds);
    if (cmds.length>1) {
      // check membership
      const action = cmds[0].trim();
      const chat_id = Number(cmds[1].trim());
      const { data, error } = await supabaseClient.from('chats').select('*').eq('id', chat_id);
      const chat = data && data[0];
      if (DEBUG) console.log('action:', action, '/start chat:', chat);
      ctx.session.data = { chat };
      if (action==='bot') {
        await pmInlineKeyboard(ctx, chat.invite);
      } else if (['add','tasks','unregister','register'].includes(action) && isMember(chat, ctx.session.user)) {
        await ctx.deleteMessage();
        await ctx.conversation.enter(action);
      } else if (action==='update' && isMember(chat, ctx.session.user, true)) {
        await ctx.deleteMessage();
        await ctx.conversation.enter(action);
      } else if (action==='update' && chat?.id) {
        await ctx.reply(ctx.t('member', { chat_title: chat.title, chat_id: String(chat.id) }));
        await ctx.deleteMessage();
      } else {
        await pmInlineKeyboard(ctx, chat.invite);
      }
    } else {
      await pmInlineKeyboard(ctx);
    }
  });
  pm.command('ping', async (ctx: BotContext) => {
    await ctx.reply(`Pong!
    ${new Date()}
    ${Date.now()}
    `);
    ctx.deleteMessage();
  });

  pm.hears(/files*(.+)?/, async (ctx: BotContext, dir = 'content') => {
    if (ADMIN_IDS.includes(ctx.from.id)) {
      const [cmd, dir] = ctx.match;
      const { files, error } = await getFiles(dir && dir.trim().toLowerCase());
      await ctx.reply(`${JSON.stringify(files,null,2)}`);
      ctx.deleteMessage();
    }
  });

  // Getting files
  pm.on([":file", ":media", ":voice", ":audio", ":video", ":animation"], async (ctx: BotContext) => {
    if (ADMIN_IDS.includes(ctx.session?.user?.id)) {
      await uploadBotFile(ctx);
    } else {
      await helpInlineKeyboard(ctx, true);
    }
  });

  pm.on('message:text', async (ctx: BotContext) => {
    if (ADMIN_IDS.includes(ctx.session?.user?.id)) {
      await ctx.reply(`${JSON.stringify(ctx.session,null,2)}`);
    }
    await helpInlineKeyboard(ctx, true);
  });
  //pm.on('message:photo', (ctx: BotContext) => ctx.reply(ctx.t('start')));
  //pm.on('edited_message', (ctx: BotContext) => ctx.reply('Ha! Gotcha! You just edited this!', { reply_to_message_id: ctx.editedMessage.message_id }));

  // replying /help command in
  bot.hears(/help*(.+)?/, async (ctx: BotContext) => {
    if (ctx.chat.id!==ctx.from.id) {
      await chatInlineKeyboard(ctx, ['bot']); // ctx.session.user?.helper_in === ctx.chat.id ? ['tasks', 'unregister'] : ['add', 'register']
    } else {
      await helpInlineKeyboard(ctx, true); // , ctx.session.data?.chat?.invite
    }
  });
  // replying /menu command in
  bot.hears(/menu*(.+)?/, async (ctx: BotContext) => {
    if (ctx.chat.id!==ctx.from.id) {
      await chatInlineKeyboard(ctx, ['bot']); // ctx.session.user?.helper_in === ctx.chat.id ? ['tasks', 'unregister'] : ['add', 'register']
    } else {
      await pmInlineKeyboard(ctx); // , ctx.session.data?.chat?.invite
    }
  });
  // replying /upd command in
  bot.command('upd', async (ctx: BotContext) => {
    if (ctx.chat.id!==ctx.from.id) {
      const { invite_link } = await bot.api.createChatInviteLink(ctx.chat.id);
      if (!!invite_link) await supabaseClient.from('chats').update({ updated_at: new Date(), invite: invite_link }).eq('id', ctx.chat.id);
      if (DEBUG) console.log('/upd invite_link:', invite_link);
      await chatInlineKeyboard(ctx, ['update']);
      //await ctx.reply(ctx.t('reg', { bot_name: TELEGRAM_BOT_NAME, chat_id: String(ctx.chat.id) }), { reply_to_message_id: ctx.msg.message_id });
    } else {
      await ctx.deleteMessage();
      await ctx.conversation.enter('update');
    }
  });
  // Exit conversations when the inline keyboard's `exit` button is pressed.
  bot.callbackQuery('/exit', async (ctx) => {
    await ctx.conversation.exit();
    await ctx.answerCallbackQuery();
    await pmInlineKeyboard(ctx);
    if (DEBUG) console.log('callbackQuery /exit');
  });
  bot.on('callback_query:data', async (ctx) => {
    console.log('Unknown button event with ctx.callbackQuery:', ctx.callbackQuery);
    await ctx.answerCallbackQuery(); // remove loading animation
    const match = ctx.callbackQuery.data.split(' ');
    if (match.length>1 && match[0]=='/lang') {
      const lang: Lang = match[1].trim().toLowerCase();
      if (!!lang) await setLocale(ctx, lang);
    }
    await helpInlineKeyboard(ctx, true);
  });

  notifyAdmins();

  return {
    bot,
    run,
    handleUpdate: webhookCallback(bot, 'std/http'),
  };
};

/*

file: {
  file_id: "CQACAgIAAxkBAAIEX2RuIUuWTQcNM7rsq1b7fYpQtvZqAAL4KwACeBtwS5CiUh9-CQzKLwQ",
  file_unique_id: "AgAD-CsAAngbcEs",
  file_size: 2837325,
  file_path: "music/file_0.mp3",
  getUrl: [Function: getUrl],
  download: [AsyncFunction: download]
}

uploadFile: { path: "music/b2d5dd67de1feb2500c771183ee735aa-file_0.mp3" }

getFiles: [
  {
    name: "b2d5dd67de1feb2500c771183ee735aa-file_0.mp3",
    id: "3afdfcfa-9884-4836-a066-e4a8089e8396",
    updated_at: "2023-05-24T14:30:07.448795+00:00",
    created_at: "2023-05-24T14:30:07.212706+00:00",
    last_accessed_at: "2023-05-24T14:30:07.212706+00:00",
    metadata: {
      eTag: '"b2d5dd67de1feb2500c771183ee735aa"',
      size: 2837325,
      mimetype: "text/plain;charset=UTF-8",
      cacheControl: "max-age=3600",
      lastModified: "2023-05-24T14:30:08.000Z",
      contentLength: 2837325,
      httpStatusCode: 200
    }
  }
]



  bot.inlineQuery(/best*(.+)?/, async (ctx) => {
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
  });
  // Return empty result list for other queries.
  bot.on('inline_query', (ctx) => ctx.answerInlineQuery([]));

  bot.hears('salut', (ctx) => ctx.reply('salut'));
  bot.hears('hello', (ctx) => ctx.reply('hello'));
  bot.hears('hola', (ctx) => ctx.reply('hola'));

*/
