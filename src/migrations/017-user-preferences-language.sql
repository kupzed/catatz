-- =============================================
-- Migration 017: User Preferences Language
-- Adds language preference column for i18n support.
-- =============================================

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'id';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_user_preferences_language'
      AND conrelid = 'public.user_preferences'::regclass
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT chk_user_preferences_language
      CHECK (language IN ('id', 'en'));
  END IF;
END $$;
