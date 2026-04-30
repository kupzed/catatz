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
  created_at  TIMESTAMPTZ DEFAULT NOW()
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
-- Seed: Default System Categories (income)
-- =============================================
INSERT INTO public.kategori (nama, ikon, warna, tipe, is_system) VALUES
  ('Gaji',         '💼', '#10b981', 'income',  TRUE),
  ('Bonus',        '🎁', '#f59e0b', 'income',  TRUE),
  ('Investasi',    '📈', '#3b82f6', 'income',  TRUE),
  ('Freelance',    '💻', '#8b5cf6', 'income',  TRUE),
  ('Hadiah',       '🎀', '#ec4899', 'income',  TRUE),
  ('Lainnya',      '➕', '#6b7280', 'income',  TRUE);

-- =============================================
-- Seed: Default System Categories (expense)
-- =============================================
INSERT INTO public.kategori (nama, ikon, warna, tipe, is_system) VALUES
  ('Makan & Minum','🍔', '#f97316', 'expense', TRUE),
  ('Transportasi', '🚗', '#06b6d4', 'expense', TRUE),
  ('Belanja',      '🛍️', '#e879f9', 'expense', TRUE),
  ('Tagihan',      '📄', '#64748b', 'expense', TRUE),
  ('Kesehatan',    '🏥', '#ef4444', 'expense', TRUE),
  ('Hiburan',      '🎮', '#a855f7', 'expense', TRUE),
  ('Pendidikan',   '📚', '#3b82f6', 'expense', TRUE),
  ('Rumah',        '🏠', '#84cc16', 'expense', TRUE),
  ('Pakaian',      '👕', '#f59e0b', 'expense', TRUE),
  ('Olahraga',     '🏋️', '#10b981', 'expense', TRUE),
  ('Sosial',       '👥', '#ec4899', 'expense', TRUE),
  ('Lainnya',      '📌', '#6b7280', 'expense', TRUE);
