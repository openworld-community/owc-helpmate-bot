DROP TABLE IF EXISTS public.profiles;

-- Create a table for public profiles
create table public.profiles (
  id BIGINT NOT NULL,
  uid uuid NOT NULL DEFAULT gen_random_uuid(),
  country BIGINT NULL,
  state BIGINT NULL,
  city BIGINT NULL,
  is_bot BOOLEAN NULL,
  role VARCHAR NULL DEFAULT 'user'::character varying,
  phone VARCHAR NULL DEFAULT ''::character varying ,
  first_name VARCHAR NULL DEFAULT ''::character varying ,
  last_name VARCHAR NULL DEFAULT ''::character varying ,
	username VARCHAR NULL DEFAULT ''::character varying ,
  language_code VARCHAR NULL DEFAULT ''::character varying ,
  lang VARCHAR NULL DEFAULT ''::character varying ,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_country_fkey FOREIGN KEY (country) REFERENCES public.countries (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT profiles_state_fkey FOREIGN KEY (state) REFERENCES public.states (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT profiles_city_fkey FOREIGN KEY (city) REFERENCES public.cities (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT profiles_un_uid UNIQUE (uid)
);

--DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--DROP FUNCTION IF EXISTS public.handle_new_user();
