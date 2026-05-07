-- =============================================
-- Migration 005: Hutang (Debt Management)
-- =============================================

CREATE TYPE tipe_hutang AS ENUM ('memberi', 'menerima');
CREATE TYPE status_hutang AS ENUM ('aktif', 'lunas', 'overdue');

CREATE TABLE IF NOT EXISTS public.hutang (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipe                tipe_hutang NOT NULL,
  tanggal_mulai       DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu               TIME DEFAULT CURRENT_TIME,
  tanggal_jatuh_tempo DATE,
  status              status_hutang NOT NULL DEFAULT 'aktif',
  nama_entitas        TEXT NOT NULL,
  rekening_id         UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
  total_pinjaman      NUMERIC(15, 2) NOT NULL CHECK (total_pinjaman > 0),
  sisa_tagihan        NUMERIC(15, 2) NOT NULL,
  catatan             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hutang_cicilan (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hutang_id   UUID NOT NULL REFERENCES public.hutang(id) ON DELETE CASCADE,
  nominal     NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu       TIME DEFAULT CURRENT_TIME,
  rekening_id UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
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

-- =============================================
-- Trigger Functions
-- =============================================

-- 1. Update sisa_tagihan & status
CREATE OR REPLACE FUNCTION public.update_sisa_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_cicilan NUMERIC;
  v_total_pinjaman NUMERIC;
  v_new_sisa NUMERIC;
BEGIN
  SELECT COALESCE(SUM(nominal), 0) INTO v_total_cicilan
  FROM public.hutang_cicilan
  WHERE hutang_id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  SELECT total_pinjaman INTO v_total_pinjaman
  FROM public.hutang
  WHERE id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  v_new_sisa := v_total_pinjaman - v_total_cicilan;

  UPDATE public.hutang
  SET
    sisa_tagihan = GREATEST(v_new_sisa, 0),
    status = CASE WHEN v_new_sisa <= 0 THEN 'lunas'::status_hutang ELSE 'aktif'::status_hutang END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Update saldo dari tabel hutang
CREATE OR REPLACE FUNCTION public.update_saldo_rekening_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Revert old balance
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.rekening_id IS NOT NULL THEN
    IF OLD.tipe = 'menerima' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - OLD.total_pinjaman WHERE id = OLD.rekening_id;
    ELSIF OLD.tipe = 'memberi' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + OLD.total_pinjaman WHERE id = OLD.rekening_id;
    END IF;
  END IF;

  -- Apply new balance
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.rekening_id IS NOT NULL THEN
    IF NEW.tipe = 'menerima' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + NEW.total_pinjaman WHERE id = NEW.rekening_id;
    ELSIF NEW.tipe = 'memberi' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - NEW.total_pinjaman WHERE id = NEW.rekening_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Update saldo dari tabel hutang_cicilan
CREATE OR REPLACE FUNCTION public.update_saldo_rekening_cicilan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tipe_hutang text;
BEGIN
  SELECT tipe INTO v_tipe_hutang FROM public.hutang WHERE id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  -- Revert old balance
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.rekening_id IS NOT NULL THEN
    IF v_tipe_hutang = 'menerima' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + OLD.nominal WHERE id = OLD.rekening_id;
    ELSIF v_tipe_hutang = 'memberi' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - OLD.nominal WHERE id = OLD.rekening_id;
    END IF;
  END IF;

  -- Apply new balance
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.rekening_id IS NOT NULL THEN
    IF v_tipe_hutang = 'menerima' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - NEW.nominal WHERE id = NEW.rekening_id;
    ELSIF v_tipe_hutang = 'memberi' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + NEW.nominal WHERE id = NEW.rekening_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers
CREATE TRIGGER trg_rekening_hutang
  AFTER INSERT OR UPDATE OF total_pinjaman, rekening_id OR DELETE ON public.hutang
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_hutang();

CREATE TRIGGER trg_update_sisa_hutang
  AFTER INSERT OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_sisa_hutang();

CREATE TRIGGER trg_rekening_cicilan
  AFTER INSERT OR UPDATE OF nominal, rekening_id OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_cicilan();
