DROP TABLE IF EXISTS public.bot_sessions;

CREATE TABLE public.bot_sessions (
  id VARCHAR NOT NULL DEFAULT ''::character varying,
  session TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT bot_sessions_pkey PRIMARY KEY (id)
);
