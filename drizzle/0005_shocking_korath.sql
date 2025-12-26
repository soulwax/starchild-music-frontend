-- File: drizzle/0005_shocking_korath.sql

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'favorite_user_track_unique'
  ) THEN
    ALTER TABLE "hexmusic-stream_favorite" ADD CONSTRAINT "favorite_user_track_unique" UNIQUE("userId","trackId");
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'playlist_track_unique'
  ) THEN
    ALTER TABLE "hexmusic-stream_playlist_track" ADD CONSTRAINT "playlist_track_unique" UNIQUE("playlistId","trackId");
  END IF;
END $$;
