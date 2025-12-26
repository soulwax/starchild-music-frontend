-- File: drizzle/0010_nostalgic_human_cannonball.sql

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexmusic-stream_user_preferences' AND column_name = 'equalizerPanelOpen'
  ) THEN
    ALTER TABLE "hexmusic-stream_user_preferences" ADD COLUMN "equalizerPanelOpen" boolean DEFAULT false NOT NULL;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexmusic-stream_user_preferences' AND column_name = 'queuePanelOpen'
  ) THEN
    ALTER TABLE "hexmusic-stream_user_preferences" ADD COLUMN "queuePanelOpen" boolean DEFAULT false NOT NULL;
  END IF;
END $$;
