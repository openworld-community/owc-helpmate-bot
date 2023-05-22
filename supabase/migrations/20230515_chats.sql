DROP TABLE IF EXISTS public.chats;

-- Create a table for chats
create table public.chats (
  id BIGINT NOT NULL,
  uid uuid NOT NULL DEFAULT gen_random_uuid(),
  country BIGINT NULL,
  state BIGINT NULL,
  city BIGINT NULL,
  creator BIGINT NULL,
  admins JSON NULL,
  members JSON NULL,
  all_members_are_administrators BOOLEAN NULL,
  type VARCHAR NULL DEFAULT 'group'::character varying,
	title VARCHAR NULL DEFAULT ''::character varying ,
  lang VARCHAR NULL DEFAULT ''::character varying ,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_country_fkey FOREIGN KEY (country) REFERENCES public.countries (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT chats_state_fkey FOREIGN KEY (state) REFERENCES public.states (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT chats_city_fkey FOREIGN KEY (city) REFERENCES public.cities (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT chats_un_uid UNIQUE (uid)
);
