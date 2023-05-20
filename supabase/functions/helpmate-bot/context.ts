import { type ChatMembersFlavor } from 'grammy_chat_members';
import { Api, Context, NextFunction, SessionFlavor } from 'grammy';
import { HydrateApiFlavor, HydrateFlavor } from 'grammy_hydrate';
import { FluentContextFlavor } from 'grammyfluent';
import ShortUniqueId from 'short-unique-id';
import { toUUID, fromUUID } from '$lib/utils.ts';
import { supabaseClient } from '$lib/supabase.ts';
import type { MemberData, User, Chat, Role, Lang, Profile, Session } from '$lib/types.ts';

import ENV from '$lib/vars.ts';
const { DEBUG, ADMIN_IDS, DEFAULT_LANG = 'en' } = ENV;

const uid = new ShortUniqueId({ length: 32 });

export const isPrivateChat = (ctx: Context): boolean => (!!ctx.session?.user?.id && Number(ctx.chat.id)>0);

export const getLocale = async (ctx: Context): Promise<Lang> => {
  return ctx.session && '__language_code' in ctx.session && ctx.session['__language_code'];
};

export const setLocale = async (ctx: Context, lang: Lang = DEFAULT_LANG): Promise<Lang> => {
  const user: UserData = ctx.session.user;
  if (!!!user?.id) return lang;
  ctx.session['__language_code'] = lang;
  await ctx.fluent.useLocale(lang);
  const update = await supabaseClient.from('profiles').update({ lang, updated_at: new Date() }).eq('id', user.id).select();
  if (DEBUG) console.log('setLocale update:', update);
  return lang;
};

export const syncLocale = async (ctx: Context): Promise<Lang> => {
  let lang: Lang = await getLocale(ctx);
  if (!!!lang) lang = await setLocale(ctx, ctx.session?.user?.language_code);
  return lang;
};

export const syncProfile = async (ctx: Context, user: User): Promise<Profile> => {
  if (!!!user?.id) return;

  const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', user.id);
  let profile: Profile = !error && data.length>0 && data[0];

  if (!profile) {
    profile = user;
    profile.lang = profile.language_code;
    if (ADMIN_IDS.includes(user.id)) profile.role = 'super';

    const insert = await supabaseClient.from('profiles').insert(profile).select();
    if (DEBUG) console.log('SessionSave profile insert:', insert);
    if (insert?.data) profile = insert.data[0];
  } else {
    // sync profile data
    const update_profile = false;

    const lang: Lang = await getLocale(ctx);
    if (!!lang && profile.lang !== lang) {
      update_profile = true;
      profile.lang = lang;
    }

    ['phone','first_name','last_name','username','language_code'].forEach(key => {
      if (profile[key] !== user[key]) {
        update_profile = true;
        profile[key] = user[key];
      }
    });

    if (update_profile) {
      const update = await supabaseClient.from('profiles').update({ updated_at: new Date(), ...profile }).eq('id', profile.id).select();
      if (DEBUG) console.log('SessionSave profile update:', update);
      if (update?.data) profile = update.data[0];
    }
  }

  return profile;
};

export const syncChat = async (ctx: Context, chat: Chat, chat_member?: MemberData): Promise<Chat> => {
  if (!!!chat?.id) return;

  chat.admins = chat.members = [];
  if (chat_member?.user?.id) {
    if (chat_member?.status==='creator') chat.creator = chat_member.user.id;
    else if (chat_member?.status==='admin') chat.admins.push(chat_member.user.id);
    else chat.members.push(chat_member.user.id);
  }

  const { data, error } = await supabaseClient.from('chats').select('*').eq('id', chat.id);
  let chatData: Chat = !error && data.length>0 && data[0];
  if (!chatData) {
    const insert = await supabaseClient.from('chats').insert(chat).select();
    if (DEBUG) console.log('SessionSave chat insert:', insert);
  } else {
    // sync chat data
    const update_chat = false;

    if (chat_member?.user?.id) {
      if (chat.admins.length>0 && !chatData.admins.includes(chat_member.user.id)) {
        update_chat = true;
        chatData.admins.push(chat_member.user.id);
      }
      if (chat.members.length>0 && !chatData.members.includes(chat_member.user.id)) {
        update_chat = true;
        chatData.members.push(chat_member.user.id);
      }
    }

    ['creator', 'title','type','all_members_are_administrators'].forEach(key => {
      if (chatData[key] !== chat[key]) {
        update_chat = true;
        chatData[key] = chat[key];
      }
    });

    if (update_chat) {
      const update = await supabaseClient.from('chats').update({ updated_at: new Date(), ...chatData }).eq('id', chatData.id).select();
      if (DEBUG) console.log('SessionSave chat update:', update);
    }
  }

  return chatData;
};

// Install session middleware, and define the initial session value.
export const SessionInit = (): Session => {
  return {
    uid: toUUID(uid.stamp(32)), // uid.parseStamp(fromUUID(uidWithTimestamp))
  };
};

export const SessionSave = async (ctx: Context, next: NextFunction): Promise<void> => {
  ctx.session.uid = ctx.session.uid || toUUID(uid.stamp(32));

  const chat: Chat = ctx.chat;
  if (DEBUG) console.log('SessionSave chat:', chat);

  const chat_member: MemberData = await ctx.chatMembers.getChatMember();
  if (DEBUG) console.log('SessionSave chat_member:', chat_member);

  const user: UserData = {
    id: Number(ctx.from?.id),
    is_bot: !!ctx.from?.is_bot,
    phone: String(ctx.from?.phone || ''),
    first_name: String(ctx.from?.first_name || ''),
    last_name: String(ctx.from?.last_name || ''),
    username: String(ctx.from?.username || ''),
    language_code: String(ctx.from?.language_code || DEFAULT_LANG),
  };
  if (DEBUG) console.log('SessionSave user:', user);

  const profile = await syncProfile(ctx, user);

  if (ctx.from.id !== ctx.chat.id) {
    ctx.session.chat = await syncChat(ctx, chat, chat_member);
  } else {
    ctx.session.user = profile;
  }

  if (isPrivateChat(ctx)) await next();
};

// Flavor the context type to include sessions.
export type HydrateContext = HydrateFlavor<Context> & HydrateApiFlavor<Api>;
export type SessionContext = SessionFlavor<Session> & FluentContextFlavor;
export type BotContext = HydrateContext & SessionContext & ChatMembersFlavor;
