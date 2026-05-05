-- =============================================
-- Migration 010: Trigger Sinkronisasi Saldo Rekening - Hutang
-- =============================================

-- Fungsi untuk update saldo dari tabel hutang
CREATE OR REPLACE FUNCTION public.update_saldo_rekening_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Revert old balance if applicable
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.rekening_id IS NOT NULL THEN
    IF OLD.tipe = 'menerima' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - OLD.total_pinjaman WHERE id = OLD.rekening_id;
    ELSIF OLD.tipe = 'memberi' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + OLD.total_pinjaman WHERE id = OLD.rekening_id;
    END IF;
  END IF;

  -- Apply new balance if applicable
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

DROP TRIGGER IF EXISTS trg_rekening_hutang ON public.hutang;
CREATE TRIGGER trg_rekening_hutang
  AFTER INSERT OR UPDATE OF total_pinjaman, rekening_id OR DELETE ON public.hutang
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_hutang();


-- Fungsi untuk update saldo dari tabel hutang_cicilan
CREATE OR REPLACE FUNCTION public.update_saldo_rekening_cicilan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tipe_hutang text;
BEGIN
  -- Ambil tipe hutang untuk menentukan arah cash flow
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

DROP TRIGGER IF EXISTS trg_rekening_cicilan ON public.hutang_cicilan;
CREATE TRIGGER trg_rekening_cicilan
  AFTER INSERT OR UPDATE OF nominal, rekening_id OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_cicilan();
