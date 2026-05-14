-- =============================================
-- Migration 003: Kategori (Categories)
-- =============================================

CREATE TABLE IF NOT EXISTS public.kategori (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- NULL = system category
  nama        TEXT NOT NULL,
  ikon        TEXT NOT NULL DEFAULT '💰',
  warna       TEXT NOT NULL DEFAULT '#6366f1',
  tipe        TEXT NOT NULL CHECK (tipe IN ('income', 'expense', 'all')) DEFAULT 'all',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kategori ENABLE ROW LEVEL SECURITY;

-- Users can see system categories AND their own custom categories
CREATE POLICY "kategori: select own and system" ON public.kategori
  FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);
CREATE POLICY "kategori: insert own" ON public.kategori
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "kategori: update own" ON public.kategori
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "kategori: delete own" ON public.kategori
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- =============================================
-- Seed: Default System Categories
-- =============================================
INSERT INTO public.kategori (nama, ikon, warna, tipe, is_system) VALUES
  ('Gaji',         '💼', '#10b981', 'income',  TRUE),
  ('Bonus',        '🎁', '#f59e0b', 'income',  TRUE),
  ('Makan & Minum','🍔', '#f97316', 'expense', TRUE),
  ('Transportasi', '🚗', '#06b6d4', 'expense', TRUE),
  ('Kesehatan',    '🏥', '#ef4444', 'expense', TRUE),
  ('Lainnya',      '📌', '#6b7280', 'all',     TRUE);

-- Grant API access (Supabase v1.26.05+)
GRANT SELECT ON public.kategori TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kategori TO authenticated;
