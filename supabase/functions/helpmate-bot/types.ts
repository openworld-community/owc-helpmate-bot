export type UUID = string; // 'GDa608f973aRCHLXQYPTbKDbjDeVsSb3'
export type ISODate = string; // '2021-10-29T21:52:35.830Z'
export type Timestamp = number | string; // 1683628086
export type Date = ISODate | Timestamp | null;

export enum Country {
  RU = 'RU',
  BY = 'BY',
  UA = 'UA',
  US = 'US',
  UK = 'UK',
};

export enum Lang {
  RU = 'ru',
  EN = 'en',
};

export enum LangCode {
  RU = 'ru-RU',
  EN = 'en-US',
};

export interface SessionData {
  id: number;
  uid?: UUID;
  type?: string;
  query_id?: string;
  auth_date?: Date;
  hash?: string;
  country?: Country;
	language_code?: Lang;
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
