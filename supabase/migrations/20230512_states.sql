CREATE TABLE "public"."states" (
  "id" BIGINT NOT NULL,
  "country" BIGINT NULL,
  "name" VARCHAR NULL DEFAULT ''::character varying ,
  "code" VARCHAR NULL DEFAULT ''::character varying ,
  "type" VARCHAR NULL DEFAULT ''::character varying ,
  "latitude" NUMERIC NULL,
  "longitude" NUMERIC NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  "updated_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT now() ,
  CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."states" ADD CONSTRAINT "states_country_fkey" FOREIGN KEY ("country") REFERENCES "public"."countries" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
