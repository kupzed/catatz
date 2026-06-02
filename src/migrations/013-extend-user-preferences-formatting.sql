-- =============================================
-- Migration 013: Extend User Preferences Formatting
-- Adds decimal and time display preferences.
-- =============================================

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS show_decimal_places BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS time_format TEXT NOT NULL DEFAULT '24h';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_user_preferences_time_format'
      AND conrelid = 'public.user_preferences'::regclass
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT chk_user_preferences_time_format
      CHECK (time_format IN ('24h', '12h'));
  END IF;
END $$;
