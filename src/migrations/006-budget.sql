-- =============================================
-- Migration 006: Budget
-- =============================================

CREATE TABLE IF NOT EXISTS public.budget (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kategori_id     UUID NOT NULL REFERENCES public.kategori(id) ON DELETE CASCADE,
  bulan           SMALLINT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun           SMALLINT NOT NULL,
  limit_nominal   NUMERIC(15, 2) NOT NULL CHECK (limit_nominal > 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, kategori_id, bulan, tahun)
);

CREATE INDEX idx_budget_user_period ON public.budget(user_id, tahun, bulan);

ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget: select own" ON public.budget
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budget: insert own" ON public.budget
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget: update own" ON public.budget
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budget: delete own" ON public.budget
  FOR DELETE USING (auth.uid() = user_id);
