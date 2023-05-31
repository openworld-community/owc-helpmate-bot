DROP TABLE IF EXISTS public.tasks;

-- Create a table for tasks
create table public.tasks (
  uid uuid NOT NULL DEFAULT gen_random_uuid(),
  chat BIGINT NULL,
  profile BIGINT NULL,
  helper BIGINT NULL,
  status VARCHAR NULL DEFAULT 'open'::character varying , -- open bad closed expired
  payload JSON NULL,
  description TEXT NULL,
  comments TEXT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT tasks_pkey PRIMARY KEY (uid),
  CONSTRAINT tasks_chat_fkey FOREIGN KEY (chat) REFERENCES public.chats (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT tasks_profile_fkey FOREIGN KEY (profile) REFERENCES public.profiles (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
