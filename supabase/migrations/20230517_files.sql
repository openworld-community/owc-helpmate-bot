DROP TABLE IF EXISTS public.files;

-- Create a table for files
create table public.files (
  uid uuid NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR NULL DEFAULT ''::character varying ,
  file_id VARCHAR NULL DEFAULT ''::character varying ,
  file_unique_id VARCHAR NULL DEFAULT ''::character varying ,
  file_path VARCHAR NULL DEFAULT ''::character varying ,
  file_size BIGINT NULL ,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT files_uid_fkey FOREIGN KEY (uid) REFERENCES storage.objects (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT files_un_unique_id UNIQUE (file_unique_id),
  CONSTRAINT files_un_id UNIQUE (file_id)
);
