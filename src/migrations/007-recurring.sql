-- =============================================
-- Migration 007: Recurring Transactions
-- =============================================

CREATE TYPE interval_recurring AS ENUM ('harian', 'mingguan', 'bulanan', 'tahunan');

CREATE TABLE IF NOT EXISTS public.recurring_transaksi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Snapshot of the transaction template
  tipe            tipe_transaksi NOT NULL,
  nominal         NUMERIC(15, 2) NOT NULL,
  kategori_id     UUID REFERENCES public.kategori(id) ON DELETE SET NULL,
  rekening_id     UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
  rekening_tujuan UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
  catatan         TEXT,
  tags            TEXT[] DEFAULT '{}',
  -- Scheduling
  interval_type   interval_recurring NOT NULL DEFAULT 'bulanan',
  next_run        DATE NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recurring_transaksi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring: select own" ON public.recurring_transaksi
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring: insert own" ON public.recurring_transaksi
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring: update own" ON public.recurring_transaksi
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring: delete own" ON public.recurring_transaksi
  FOR DELETE USING (auth.uid() = user_id);

-- Grant API access (Supabase v1.26.05+)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transaksi TO authenticated;
