export type UUID = string; // 'GDa608f973aRCHLXQYPTbKDbjDeVsSb3'
export type ISODate = string; // '2021-10-29T21:52:35.830Z'
export type Timestamp = number | string; // 1683628086
export type Date = ISODate | Timestamp;
export type Lang = string | undefined;

export type ChatID = number | string;
export type UserID = number | string;
export type MessageID = number | string;
export type CountryID = number | string;
export type StateID = number | string;
export type CityID = number | string;

export interface GeoData {
  country?: CountryID;
  state?: StateID;
  city?: CityID;
};

export interface UserData {
  id: UserID;
  is_bot: boolean;
  phone?: string;
	first_name?: string;
  last_name?: string;
	username?: string;
  language_code?: Lang;
};

export type User = UserData | UserID;

export interface InitData {
  query_id?: string;
  user: User;
  auth_date?: Date;
  hash?: string;
};

export interface MemberData {
  user: User;
  status?: string;
  is_anonymous?: boolean;
};

export type ChatData = {
  id: ChatID;
  uid: UUID;
  type: string;
  title?: string;
  all_members_are_administrators?: boolean;
  members?: MemberData[];
} & GeoData;

export type Chat = ChatData | ChatID | undefined;

export interface MessageData {
  message_id: MessageID;
  from: User;
	chat: Chat;
  date: Date;
  text: string;
};

export type Message = MessageData | MessageID;

export enum Role {
  SUPER = 'super',
  ADMIN = 'admin',
  HELPER = 'helper',
  USER = 'user',
  ANON = 'anon',
  BOT = 'bot',
};

export type ProfileData = {
  uid: UUID;
  role: Role;
  lang?: Lang;
  created_at?: Date;
  updated_at?: Date;
} & UserData & GeoData;

export type Profile = ProfileData | undefined;

export interface SessionData {
  uid: UUID;
  chat?: Chat;
  user?: Profile;
	expiry_date?: Date;
  error?: string | number;
	page?: number;
  __language_code?: Lang;
};

export type SessionView = SessionData & InitData;

export type Session = SessionView | null;

export interface BotSessionData {
	id: ChatID;
	session: Session;
	created_at: Date;
};

export type BotSession = BotSessionData | undefined;

export interface AuthCallbacks {
	signIn?: () => boolean | Promise<boolean>;
	session?: (session: Session) => Session | Promise<Session>;
	redirect?: (url: string) => string | Promise<string>;
}
