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
    { type: 'text', label: ctx.t('tasks_helper'), action: '/tasks helper', row: true },
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

const replyInlineButton = async (ctx: BotContext, text: string, label: string, action: string, type: string = 'text', row: boolean = true): Promise<void> => {
  const inlineButtons: InlineButton[] = [{ type, label, action, row }];
  await ctx.reply(text, { reply_markup: makeInlineKeyboard(inlineButtons) });
};

const exitInlineButton = async (ctx: BotContext, text: string): Promise<void> => replyInlineButton(ctx, text, ctx.t('exit'), '/exit');

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

export const initBot = async () => {
  const bot = new Bot<BotContext>(TELEGRAM_BOT_TOKEN);

  const sendMessage = (id: number, text: string, options: object = { parse_mode: 'HTML' }): Promise<void> => bot.api.sendMessage(id, text, options);

  const bulkSendMessage = (ids: number[], text: string, options: object) => ids.forEach(id => sendMessage(id, text, options));

  const bulkNotifyHelpers = (helpers: object[], fluent: string, desc: string, options: object) => {
    for (let i=0;i<helpers.length;i++) {
      const lang = helpers[i].profiles.lang || helpers[i].profiles.language_code;
      const text = locales[lang][fluent].replaceAll('{$chat_title}', helpers[i].chats.title)+"\n "+desc;
      sendMessage(helpers[i].id, text, options);
    }
  };

  const sendInlineButton = async (id: number, text: string, label: string, action: string, type: string = 'text', row: boolean = true): Promise<void> => {
    const inlineButtons: InlineButton[] = [{ type, label, action, row }];
    await sendMessage(id, text, { reply_markup: makeInlineKeyboard(inlineButtons) });
  };

  const bulkSendInline = (ids: number[], text: string, label: string, action: string, type: string = 'text', row: boolean = true) => ids.forEach(id => sendInlineButton(id, text, label, action, type, row));

  const sendTaskInline = (lang: Lang, id: number, text: string, task_uid: string, task?: object) => {
    const inlineButtons: InlineButton[] = task ? (task.helper === id ? [
      { type: 'text', label: locales[lang].task_close, action: '/task close '+task_uid, row: true },
      { type: 'text', label: locales[lang].task_bad, action: '/task bad '+task_uid, row: true },
    ] : [
      { type: 'text', label: locales[lang].task_accept, action: '/task accept '+task_uid, row: true },
      { type: 'text', label: locales[lang].task_bad, action: '/task bad '+task_uid, row: true },
    ]) : [
      { type: 'text', label: locales[lang].task, action: '/task info '+task_uid, row: true },
    ];
    const inlineKeyboard = makeInlineKeyboard(inlineButtons);
    sendMessage(id, text, { reply_markup: makeInlineKeyboard(inlineButtons) });
  };

  const bulkSendTaskInline = (helpers: object[], fluent: string, task?: object) => {
    if (DEBUG) console.log('bulkSendTaskInline helpers:', helpers, 'task:', task);
    for (let i=0;i<helpers.length;i++) {
      const { uid, description } = task || helpers[i];
      const lang = helpers[i].profiles.lang || helpers[i].profiles.language_code;
      const text = locales[lang][fluent].replaceAll('{$chat_title}', helpers[i].chats.title)+"\n "+description;
      sendTaskInline(lang, helpers[i].profiles.id, text, uid, task);
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
        await ctx.answerCallbackQuery({ text: ctx.t('registered'), show_alert: true });
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
    const chat_id = ctx.session.user.helper_in;
    if (!!chat_id) {
      const del = await supabaseClient.from('helpers').delete().eq('id', ctx.session.user.id);
      if (DEBUG) console.log('unregisterHelper helpers del:', del);
      if (!del.error) {
        ctx.session.user.helper_in = null;
      }
      const update = await supabaseClient.from('tasks').update({ updated_at: new Date(), helper: null }).eq('status', 'open').eq('helper', ctx.session.user.id).select('*, profiles ( id, lang, language_code ), chats ( title )');
      if (!update.error && update.data?.length>0) {
        bulkSendTaskInline(update.data, 'task_returned');
        const tasks = update.data.map(el=>el.uid);
        if (DEBUG) console.log('unregisterHelper tasks:', tasks);
        const helpers = await supabaseClient.from('helpers').select('id, profiles ( id, lang, language_code ), chats ( title )').eq('chat', chat_id);
        if (DEBUG) console.log('unregisterHelper helpers:', helpers);
        if (!helpers.error && helpers.data?.length>0) {
          bulkNotifyHelpers(helpers.data, 'tasks_returned', JSON.stringify(tasks,null,2));
        }
      }
      await pmInlineKeyboard(ctx);
      await ctx.answerCallbackQuery({ text: ctx.t('unregistered'), show_alert: true });
    } else {
      await ctx.reply(ctx.t('error_nothelper'));
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
        await exitInlineButton(ctx, ctx.t('task_description')+"\n "+ctx.t('press_exit'));
        const convCtx = await conversation.waitFor(':text');
        if (DEBUG) console.log('convCtx.msg.text:', convCtx.msg.text);
        if (convCtx.msg.text.startsWith('/')) {
          await ctx.reply(ctx.t('bye'));
          await convCtx.deleteMessage();
          return;
        } else if (convCtx.msg.text.length>3) {
          const expiry_date = new Date();
          expiry_date.setDate(expiry_date.getDate() + 1); // plus 1 day
          const { data: tasksData, error: tasksError } = await supabaseClient.from('tasks').upsert({ chat: chat.id, profile: ctx.from.id, description: convCtx.msg.text, expiry_date }).select();
          if (!tasksError && tasksData?.length>0) {
            const task_uid = tasksData[0].uid;
            const { data: helpersData, error: helpersError } = await supabaseClient.from('helpers').select('id, profiles ( id, lang, language_code ), chats ( title )').eq('chat', chat.id);
            if (!helpersError && helpersData?.length>0) {
              if (DEBUG) console.log('addTask helpers:', helpersError, helpersData.map(el=>el.id));
              bulkSendTaskInline(helpersData, 'task_created', tasksData[0]);
            }
            await replyInlineButton(ctx, ctx.t('task_created', { chat_title: chat.title })+"\n "+tasksData[0].description, ctx.t('task'), '/task info '+task_uid, 'text');
            done = true;
          } else {
            await ctx.reply(ctx.t('error'));
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

    await exitInlineButton(ctx, ctx.t('update_start', chat)+"\n "+ctx.t('press_exit'));

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
      const update = await supabaseClient.from('chats').update({ updated_at: new Date(), ...chat }).eq('id', chat.id).select();
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
  bot.use(createConversation(addTask, 'add'));
  bot.use(createConversation(registerHelper, 'register'));
  bot.use(createConversation(unregisterHelper, 'unregister'));
  bot.use(createConversation(updateChat, 'update'));
  //bot.errorBoundary((err) => console.error('App threw an error!', err),createConversation(register));

  // Only handle commands in private chats.
  const pm = bot.chatType('private');
  // Exit conversations when the inline keyboard's `exit` button is pressed.
  pm.callbackQuery('/exit', async (ctx) => {
    await ctx.conversation.exit();
    await ctx.answerCallbackQuery();
    await pmInlineKeyboard(ctx);
    if (DEBUG) console.log('callbackQuery /exit');
  });
  pm.callbackQuery('/add', async (ctx: BotContext) => {
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('add');
  });
  pm.callbackQuery('/register', async (ctx: BotContext) => {
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('register');
  });
  pm.callbackQuery('/unregister', async (ctx: BotContext) => {
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('unregister');
  });
  pm.callbackQuery('/unregister', async (ctx: BotContext) => {
    ctx.answerCallbackQuery();
    await ctx.conversation.enter('unregister');
  });
  pm.callbackQuery('/menu', (ctx: BotContext) => helpInlineKeyboard(ctx, true));
  pm.callbackQuery('/start', (ctx: BotContext) => pmInlineKeyboard(ctx));

  pm.on('callback_query:data', async (ctx) => {
    if (DEBUG) console.log('Event with ctx.callbackQuery:', ctx.callbackQuery, ctx.from);
    const match = ctx.callbackQuery.data.split(' ');
    if (match.length>1 && match[0]=='/lang') {
      const lang: Lang = match[1].trim().toLowerCase();
      if (!!lang) await setLocale(ctx, lang);
      await ctx.answerCallbackQuery(); // remove loading animation
      await helpInlineKeyboard(ctx, true);
    } else if (match.length>1 && match[0]==='/task') {
      const action = match[1].trim();
      const task_uid = match[2].trim();
      const { data, error } = await supabaseClient.from('tasks').select('*, profiles ( id, username, lang, language_code ), chats ( title )').eq('uid', task_uid); // .eq('status', 'open').is('helper', null)
      if (!error && data?.length>0) {
        const task = data[0];
        if (DEBUG) console.log('/task action:', action, 'task:', task);
        const lang: Lang = task.profiles.lang || task.profiles.language_code;
        if (action==='accept' && !task.helper) {
          const update = await supabaseClient.from('tasks').update({ updated_at: new Date(), helper: ctx.from.id, status: 'open' }).eq('uid', task_uid).select();
          if (DEBUG) console.log('/task:', task_uid, 'update:', update);
          if (!update.error) {
            sendInlineButton(task.profile, locales[lang].task_accepted, locales[lang].task, '/task info '+task_uid);
            await ctx.answerCallbackQuery({ text: ctx.t('task_performer', { username: task.profiles.username }), show_alert: true });
            await ctx.deleteMessage();
          } else {
            ctx.answerCallbackQuery({ text: ctx.t('error'), show_alert: true });
          }
        } else if (action==='bad' && !task.helper) {
          const update = await supabaseClient.from('tasks').update({ updated_at: new Date(), helper: ctx.from.id, status: 'bad' }).eq('uid', task_uid).select();
          if (DEBUG) console.log('/task:', task_uid, 'update:', update);
          if (!update.error) {
            sendInlineButton(task.profile, locales[lang].task_marked, locales[lang].task, '/task info '+task_uid);
            await ctx.answerCallbackQuery({ text: ctx.t('task_marker'), show_alert: true });
            await ctx.deleteMessage();
          } else {
            ctx.answerCallbackQuery({ text: ctx.t('error'), show_alert: true });
          }
        } else if (action==='close' && task.helper) {
          const update = await supabaseClient.from('tasks').update({ updated_at: new Date(), status: 'closed' }).eq('uid', task_uid).select();
          if (DEBUG) console.log('/task:', task_uid, 'update:', update);
          if (!update.error) {
            sendInlineButton(task.profile, locales[lang].task_closed, locales[lang].task, '/task info '+task_uid);
            await ctx.answerCallbackQuery({ text: ctx.t('task_closer'), show_alert: true });
            await ctx.deleteMessage();
          } else {
            ctx.answerCallbackQuery({ text: ctx.t('error'), show_alert: true });
          }
        } else if (action==='info') {
          ctx.answerCallbackQuery({ text: `Created at: ${task.created_at} \nHelper: ${task.helper} \nStatus: ${task.status} \nDescription: \n${task.description}`, show_alert: true });
        } else {
          ctx.answerCallbackQuery({ text: ctx.t('task_busy'), show_alert: true });
          await ctx.deleteMessage();
        }
      } else {
        ctx.answerCallbackQuery();
      }
    } else if (match.length>0 && match[0]==='/tasks' && !!ctx.session.user?.helper_in) {
      await ctx.answerCallbackQuery();
      let tasks;
      const now: Date = new Date;
      const action = match.length>1 && match[1].trim();
      if (action==='helper') {
        tasks = await supabaseClient.from('tasks').select('*').gt('expiry_date', now.toISOString()).eq('status', 'open').eq('helper', ctx.from.id);
      } else {
        tasks = await supabaseClient.from('tasks').select('*').gt('expiry_date', now.toISOString()).eq('status', 'open').eq('chat', ctx.session.user?.helper_in).is('helper', null);
      }
      await ctx.reply(JSON.stringify(tasks?.data?.map(el=>el.uid),null,2));
    } else {
      ctx.answerCallbackQuery(!!!ctx.session.user?.helper_in && { text: ctx.t('error_nothelper'), show_alert: true });
    }
  });

  pm.command('start', async (ctx: BotContext) => {
    const cmd = ctx.match.trim().toLowerCase();
    const cmds = cmd.split('_').filter(el=>!!el);
    if (DEBUG) console.log('/start cmds:', cmds);
    if (cmds.length>1) {
      const action = cmds[0].trim();
      const action_id = cmds[1].trim();
      if (isNumeric(action_id)) {
        const { data, error } = await supabaseClient.from('chats').select('*').eq('id', Number(action_id));
        const chat = data && data[0];
        if (DEBUG) console.log('action:', action, '/start chat:', chat);
        ctx.session.data = { chat };
        if (action==='bot') {
          await pmInlineKeyboard(ctx, chat?.invite);
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
      } else if (action==='task') {
        const { data, error } = await supabaseClient.from('tasks').select('*').eq('uid', String(action_id));
        const task = data && data[0];
        if (DEBUG) console.log('action:', action, '/start task:', task);
        ctx.reply(JSON.stringify(task,null,2));
        await ctx.deleteMessage();
      }
    } else {
      await pmInlineKeyboard(ctx);
    }
  });

  pm.command('ping', async (ctx: BotContext) => {
    await sendMessage(ctx.from.id, `Pong!
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
      await helpInlineKeyboard(ctx, true);
    }
  });
  // replying /menu command in
  bot.hears(/menu*(.+)?/, async (ctx: BotContext) => {
    if (ctx.chat.id!==ctx.from.id) {
      await chatInlineKeyboard(ctx, ['bot']); // ctx.session.user?.helper_in === ctx.chat.id ? ['tasks', 'unregister'] : ['add', 'register']
    } else {
      await pmInlineKeyboard(ctx);
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

  bulkSendMessage(ADMIN_IDS, `The @${TELEGRAM_BOT_NAME} <b>bot initialized</b>!`);

  return {
    bot,
    run,
    handleUpdate: webhookCallback(bot, 'std/http'),
  };
};


/*
reply_markup: {
    inline_keyboard: [[{
        text: 'Share with your friends',
        switch_inline_query: 'share'
    }]]
}
*/

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
