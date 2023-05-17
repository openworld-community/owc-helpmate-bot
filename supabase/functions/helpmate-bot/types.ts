import Enum from 'enum';
import { langs } from './locales.ts';
import { countries } from './countries.ts';

const langcodes = langs.map(el=>{
  const res = {};
  res[el.name] = el.code;
  return res;
});
const countrycodes = countries.map(el=>{
  const res = {};
  res[el.code] = el.code;
  return res;
});

export type Lang = new Enum(langcodes);
export type Country = new Enum(countrycodes);
export type City = string | undefined;

export type UUID = string; // 'GDa608f973aRCHLXQYPTbKDbjDeVsSb3'
export type ISODate = string; // '2021-10-29T21:52:35.830Z'
export type Timestamp = number | string; // 1683628086
export type Date = ISODate | Timestamp | null;

export interface SessionData {
  id: number;
  uid?: UUID;
  type?: string;
  query_id?: string;
  auth_date?: Date;
  hash?: string;
  country?: Country;
  city?: City;
	language_code?: Lang;
  __language_code?: Lang;
	first_name?: string;
  last_name?: string;
	username?: string;
	page?: number;
	expiry_date?: Date;
	error?: string | number;
};

export type Session = SessionData | null;

export interface BotSessionData {
	id: number;
	session: Session;
	created_at: Date;
};

export type BotSession = BotSessionData | undefined;

export interface AuthCallbacks {
	signIn?: () => boolean | Promise<boolean>;
	session?: (session: Session) => Session | Promise<Session>;
	redirect?: (url: string) => string | Promise<string>;
}
