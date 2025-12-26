-- File: drizzle/0006_good_zaran.sql

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexmusic-stream_user' AND column_name = 'userHash'
  ) THEN
    ALTER TABLE "hexmusic-stream_user" ADD COLUMN "userHash" varchar(32);
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexmusic-stream_user' AND column_name = 'profilePublic'
  ) THEN
    ALTER TABLE "hexmusic-stream_user" ADD COLUMN "profilePublic" boolean DEFAULT true NOT NULL;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexmusic-stream_user' AND column_name = 'bio'
  ) THEN
    ALTER TABLE "hexmusic-stream_user" ADD COLUMN "bio" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hexmusic-stream_user_userHash_unique'
  ) THEN
    ALTER TABLE "hexmusic-stream_user" ADD CONSTRAINT "hexmusic-stream_user_userHash_unique" UNIQUE("userHash");
  END IF;
END $$;
