-- =============================================
-- Migration 011: Hutang Cicilan Balance Safety
-- =============================================
-- Adds repayment type snapshots and update support for hutang_cicilan so
-- installment balance rollback remains correct during update/delete/cascade.

BEGIN;

ALTER TABLE public.hutang_cicilan
  ADD COLUMN IF NOT EXISTS tipe_hutang_snapshot public.tipe_hutang;

UPDATE public.hutang_cicilan c
SET tipe_hutang_snapshot = h.tipe
FROM public.hutang h
WHERE c.hutang_id = h.id
  AND c.tipe_hutang_snapshot IS NULL;

ALTER TABLE public.hutang_cicilan
  ALTER COLUMN tipe_hutang_snapshot SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_hutang_cicilan_tipe_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  SELECT h.tipe
  INTO NEW.tipe_hutang_snapshot
  FROM public.hutang h
  WHERE h.id = NEW.hutang_id;

  IF NEW.tipe_hutang_snapshot IS NULL THEN
    RAISE EXCEPTION 'Parent hutang % tidak ditemukan', NEW.hutang_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_cicilan_tipe_snapshot ON public.hutang_cicilan;
CREATE TRIGGER trg_set_cicilan_tipe_snapshot
  BEFORE INSERT OR UPDATE OF hutang_id ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.set_hutang_cicilan_tipe_snapshot();

CREATE OR REPLACE FUNCTION public.update_sisa_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_hutang_id UUID;
  v_total_cicilan NUMERIC;
  v_total_pinjaman NUMERIC;
  v_new_sisa NUMERIC;
BEGIN
  v_hutang_id := COALESCE(NEW.hutang_id, OLD.hutang_id);

  SELECT h.total_pinjaman
  INTO v_total_pinjaman
  FROM public.hutang h
  WHERE h.id = v_hutang_id;

  IF v_total_pinjaman IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(c.nominal), 0)
  INTO v_total_cicilan
  FROM public.hutang_cicilan c
  WHERE c.hutang_id = v_hutang_id;

  v_new_sisa := v_total_pinjaman - v_total_cicilan;

  UPDATE public.hutang
  SET
    sisa_tagihan = GREATEST(v_new_sisa, 0),
    status = CASE
      WHEN v_new_sisa <= 0 THEN 'lunas'::public.status_hutang
      ELSE 'aktif'::public.status_hutang
    END,
    updated_at = NOW()
  WHERE id = v_hutang_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_saldo_rekening_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.rekening_id IS NOT NULL THEN
    IF OLD.tipe = 'menerima' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini - OLD.total_pinjaman,
          updated_at = NOW()
      WHERE id = OLD.rekening_id;
    ELSIF OLD.tipe = 'memberi' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini + OLD.total_pinjaman,
          updated_at = NOW()
      WHERE id = OLD.rekening_id;
    END IF;
  END IF;

  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.rekening_id IS NOT NULL THEN
    IF NEW.tipe = 'menerima' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini + NEW.total_pinjaman,
          updated_at = NOW()
      WHERE id = NEW.rekening_id;
    ELSIF NEW.tipe = 'memberi' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini - NEW.total_pinjaman,
          updated_at = NOW()
      WHERE id = NEW.rekening_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_saldo_rekening_cicilan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_old_tipe public.tipe_hutang;
  v_new_tipe public.tipe_hutang;
BEGIN
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.rekening_id IS NOT NULL THEN
    v_old_tipe := OLD.tipe_hutang_snapshot;

    IF v_old_tipe = 'menerima' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini + OLD.nominal,
          updated_at = NOW()
      WHERE id = OLD.rekening_id;
    ELSIF v_old_tipe = 'memberi' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini - OLD.nominal,
          updated_at = NOW()
      WHERE id = OLD.rekening_id;
    END IF;
  END IF;

  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.rekening_id IS NOT NULL THEN
    v_new_tipe := NEW.tipe_hutang_snapshot;

    IF v_new_tipe = 'menerima' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini - NEW.nominal,
          updated_at = NOW()
      WHERE id = NEW.rekening_id;
    ELSIF v_new_tipe = 'memberi' THEN
      UPDATE public.rekening
      SET saldo_saat_ini = saldo_saat_ini + NEW.nominal,
          updated_at = NOW()
      WHERE id = NEW.rekening_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_rekening_hutang ON public.hutang;
CREATE TRIGGER trg_rekening_hutang
  AFTER INSERT OR UPDATE OF total_pinjaman, rekening_id, tipe OR DELETE ON public.hutang
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_hutang();

DROP TRIGGER IF EXISTS trg_update_sisa_hutang ON public.hutang_cicilan;
CREATE TRIGGER trg_update_sisa_hutang
  AFTER INSERT OR UPDATE OF nominal, hutang_id OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_sisa_hutang();

DROP TRIGGER IF EXISTS trg_rekening_cicilan ON public.hutang_cicilan;
CREATE TRIGGER trg_rekening_cicilan
  AFTER INSERT OR UPDATE OF nominal, rekening_id, hutang_id OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_cicilan();

DROP POLICY IF EXISTS "cicilan: update own" ON public.hutang_cicilan;
CREATE POLICY "cicilan: update own" ON public.hutang_cicilan
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.hutang h
      WHERE h.id = hutang_id
        AND h.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.hutang h
      WHERE h.id = hutang_id
        AND h.user_id = auth.uid()
    )
  );

COMMIT;
