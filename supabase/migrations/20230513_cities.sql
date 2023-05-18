CREATE TABLE public.cities (
  id BIGINT NOT NULL,
  country BIGINT NULL,
  state BIGINT NULL,
  name VARCHAR NULL DEFAULT ''::character varying ,
  latitude NUMERIC NULL,
  longitude NUMERIC NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT cities_pkey PRIMARY KEY (id),
  CONSTRAINT cities_country_fkey FOREIGN KEY (country) REFERENCES public.countries (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT cities_state_fkey FOREIGN KEY (state) REFERENCES public.states (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT cities_un_id UNIQUE (id)
);
