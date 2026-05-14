-- =============================================
-- Migration 002: Rekening (Accounts/Wallets)
-- =============================================

CREATE TYPE jenis_rekening AS ENUM ('Tunai', 'Bank', 'E-Wallet', 'Investasi');

CREATE TABLE IF NOT EXISTS public.rekening (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nama            TEXT NOT NULL,
  jenis           jenis_rekening NOT NULL DEFAULT 'Bank',
  saldo_awal      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  saldo_saat_ini  NUMERIC(15, 2) NOT NULL DEFAULT 0,
  warna           TEXT NOT NULL DEFAULT '#6366f1',
  logo            TEXT,                        -- bank/e-wallet slug e.g. 'bca', 'gopay'
  exclude_total   BOOLEAN NOT NULL DEFAULT FALSE,
  urutan          INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rekening ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rekening: select own" ON public.rekening
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rekening: insert own" ON public.rekening
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rekening: update own" ON public.rekening
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rekening: delete own" ON public.rekening
  FOR DELETE USING (auth.uid() = user_id);

-- Grant API access (Supabase v1.26.05+)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rekening TO authenticated;
