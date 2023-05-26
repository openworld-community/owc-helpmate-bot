DROP TABLE IF EXISTS public.tasks;

-- Create a table for tasks
create table public.tasks (
  uid uuid NOT NULL DEFAULT gen_random_uuid(),
  chat BIGINT NULL,
  helper BIGINT NULL,
  name VARCHAR NULL DEFAULT ''::character varying ,
  description TEXT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT tasks_pkey PRIMARY KEY (uid),
  CONSTRAINT tasks_chat_fkey FOREIGN KEY (chat) REFERENCES public.chats (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT tasks_helper_fkey FOREIGN KEY (helper) REFERENCES public.helpers (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
