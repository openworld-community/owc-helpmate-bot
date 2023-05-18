export type UUID = string; // 'GDa608f973aRCHLXQYPTbKDbjDeVsSb3'
export type ISODate = string; // '2021-10-29T21:52:35.830Z'
export type Timestamp = number | string; // 1683628086
export type Date = ISODate | Timestamp;
export type Lang = string;
export type ChatID = number | string;
export type Country = string;
export type State = string;
export type City = string;

export interface GeoData {
  country?: Country;
  state?: State;
  city?: City;
};

export interface UserData {
  id: ChatID;
  phone?: string;
	first_name?: string;
  last_name?: string;
	username?: string;
  language_code?: Lang;
};

export interface InitData {
  query_id?: string;
  user: UserData | ChatID;
  auth_date?: Date;
  hash?: string;
};

export interface SessionData {
  uid: UUID;
	expiry_date?: Date;
  error?: string | number;
	page?: number;
  type?: string;
  __language_code?: Lang;
};

export type SessionView = SessionData & GeoData & InitData;

export type Session = SessionView | null;

export interface BotSessionData {
	id: ChatID;
	session: Session;
	created_at: Date;
};

export type BotSession = BotSessionData | undefined;

export enum Role {
  SUPER = 'super',
  ADMIN = 'admin',
  HELPER = 'helper',
  USER = 'user',
  BOT = 'bot',
};

export type ProfileData = {
  id: ChatID;
  role: Role;
  lang?: Lang;
  created_at?: Date;
  updated_at?: Date;
} & Pick<SessionView, 'country' | 'state' | 'city' | 'phone' | 'first_name' | 'last_name' | 'username' | 'language_code'>;

export type Profile = ProfileData | undefined;

export interface AuthCallbacks {
	signIn?: () => boolean | Promise<boolean>;
	session?: (session: Session) => Session | Promise<Session>;
	redirect?: (url: string) => string | Promise<string>;
}
