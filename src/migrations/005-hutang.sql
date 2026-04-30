-- =============================================
-- Migration 005: Hutang (Debt Management)
-- =============================================

CREATE TYPE tipe_hutang AS ENUM ('memberi', 'menerima');
CREATE TYPE status_hutang AS ENUM ('aktif', 'lunas', 'overdue');

CREATE TABLE IF NOT EXISTS public.hutang (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipe                tipe_hutang NOT NULL,
  nama_entitas        TEXT NOT NULL,
  total_pinjaman      NUMERIC(15, 2) NOT NULL CHECK (total_pinjaman > 0),
  sisa_tagihan        NUMERIC(15, 2) NOT NULL,
  tanggal_mulai       DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_jatuh_tempo DATE,
  status              status_hutang NOT NULL DEFAULT 'aktif',
  catatan             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hutang_cicilan (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hutang_id   UUID NOT NULL REFERENCES public.hutang(id) ON DELETE CASCADE,
  nominal     NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  catatan     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_hutang_user   ON public.hutang(user_id, status);
CREATE INDEX idx_cicilan_hutang ON public.hutang_cicilan(hutang_id);

ALTER TABLE public.hutang         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hutang_cicilan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hutang: select own" ON public.hutang
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "hutang: insert own" ON public.hutang
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hutang: update own" ON public.hutang
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "hutang: delete own" ON public.hutang
  FOR DELETE USING (auth.uid() = user_id);

-- Cicilan RLS via parent hutang
CREATE POLICY "cicilan: select own" ON public.hutang_cicilan
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hutang h WHERE h.id = hutang_id AND h.user_id = auth.uid())
  );
CREATE POLICY "cicilan: insert own" ON public.hutang_cicilan
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.hutang h WHERE h.id = hutang_id AND h.user_id = auth.uid())
  );
CREATE POLICY "cicilan: delete own" ON public.hutang_cicilan
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.hutang h WHERE h.id = hutang_id AND h.user_id = auth.uid())
  );

-- Trigger: update sisa_tagihan & status after cicilan insert/delete
CREATE OR REPLACE FUNCTION public.update_sisa_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_cicilan NUMERIC;
  total_pinjaman NUMERIC;
  new_sisa NUMERIC;
BEGIN
  -- Recalculate total cicilan for this hutang
  SELECT COALESCE(SUM(nominal), 0) INTO total_cicilan
  FROM public.hutang_cicilan
  WHERE hutang_id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  SELECT total_pinjaman INTO total_pinjaman
  FROM public.hutang
  WHERE id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  new_sisa := total_pinjaman - total_cicilan;

  UPDATE public.hutang
  SET
    sisa_tagihan = GREATEST(new_sisa, 0),
    status = CASE WHEN new_sisa <= 0 THEN 'lunas'::status_hutang ELSE status END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_sisa_hutang
  AFTER INSERT OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_sisa_hutang();
