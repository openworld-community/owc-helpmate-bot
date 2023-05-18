// not allowed at supabase functions deploy
import { load } from 'dotenv';

const DENO_ENV = Deno.env.toObject(); // DENO_ENV.DENO_DEPLOYMENT_ID // DENO_ENV.DENO_REGION
const LOADED_ENV = (typeof load !== 'undefined' && !!!DENO_ENV.DENO_DEPLOYMENT_ID) ? { DEBUG: true, ...(await load()) } : { DEBUG: false };
const ENV = Object.assign(DENO_ENV, LOADED_ENV);

ENV.ADMIN_IDS = !!ENV.TELEGRAM_BOT_ADMINS ? ENV.TELEGRAM_BOT_ADMINS.split(',').map(el=>Number(el.trim())) : [];
ENV.BOT_SESSIONS_TABLE = 'bot_sessions';

export default ENV;
