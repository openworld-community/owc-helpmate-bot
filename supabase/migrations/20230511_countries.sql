CREATE TABLE public.countries (
  id BIGINT NOT NULL,
  name VARCHAR NULL DEFAULT ''::character varying ,
  code VARCHAR NULL DEFAULT ''::character varying ,
  latitude NUMERIC NULL,
  longitude NUMERIC NULL,
  data JSON NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT countries_pkey PRIMARY KEY (id),
  CONSTRAINT countries_un_id UNIQUE (id)
);
