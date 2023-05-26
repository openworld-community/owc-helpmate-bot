DROP TABLE IF EXISTS public.helpers;

-- Create a table for helpers
create table public.helpers (
  id BIGINT NOT NULL,
  chat BIGINT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT helpers_pkey PRIMARY KEY (id),
  CONSTRAINT helpers_chat_fkey FOREIGN KEY (chat) REFERENCES public.chats (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
