DROP TABLE IF EXISTS public.updates;

-- Create a table for updates
create table public.updates (
  id BIGINT NOT NULL,
  from_id BIGINT NULL,
  chat_id BIGINT NULL,
  message JSON NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT updates_pkey PRIMARY KEY (id),
  CONSTRAINT updates_from_fkey FOREIGN KEY (from_id) REFERENCES public.profiles (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT updates_chat_fkey FOREIGN KEY (chat_id) REFERENCES public.chats (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
