-- =============================================
-- Migration 009: User Preferences
-- Dedicated table for user settings like theme, currency, landing page.
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  theme                 TEXT DEFAULT 'system',
  currency              TEXT DEFAULT 'IDR',
  date_format           TEXT DEFAULT 'id-ID',
  number_format         TEXT DEFAULT 'id-ID',
  default_landing_page  TEXT DEFAULT '/transaksi',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries based on user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own preferences
CREATE POLICY "user_preferences: select own" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own preferences
CREATE POLICY "user_preferences: insert own" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own preferences
CREATE POLICY "user_preferences: update own" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant API access (Supabase v1.26.05+)
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
