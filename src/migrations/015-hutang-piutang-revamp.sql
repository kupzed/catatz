-- =============================================
-- Migration 015: Hutang & Piutang Revamp
-- =============================================
-- 1. Relaxes total_pinjaman check to >= 0 and defaults to 0 for party contact creation
-- 2. Adds jenis_transaksi ('pembayaran' | 'pinjaman') to hutang_cicilan
-- 3. Adds is_lunas_manual column to hutang for visual label/tag independence
-- 4. Updates triggers for flexible repayment (supporting payments exceeding loan)
--    and multi-disbursement loans without altering existing wallet balances.

BEGIN;

-- 1. Relaksasi constraint total_pinjaman & sisa_tagihan pada public.hutang
ALTER TABLE public.hutang
  ALTER COLUMN total_pinjaman SET DEFAULT 0;

ALTER TABLE public.hutang
  DROP CONSTRAINT IF EXISTS hutang_total_pinjaman_check;

ALTER TABLE public.hutang
  DROP CONSTRAINT IF EXISTS hutang_total_pinjaman_check1;

ALTER TABLE public.hutang
  DROP CONSTRAINT IF EXISTS hutang_total_pinjaman_check2;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.hutang'::regclass
      AND contype = 'c'
      AND conname ILIKE '%total_pinjaman%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.hutang DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE public.hutang
  ADD CONSTRAINT hutang_total_pinjaman_check CHECK (total_pinjaman >= 0);

ALTER TABLE public.hutang
  ALTER COLUMN sisa_tagihan SET DEFAULT 0;

ALTER TABLE public.hutang
  ALTER COLUMN tipe SET DEFAULT 'memberi';

ALTER TABLE public.hutang
  ADD COLUMN IF NOT EXISTS is_lunas_manual BOOLEAN DEFAULT FALSE;

-- 2. Penambahan jenis_transaksi pada public.hutang_cicilan
ALTER TABLE public.hutang_cicilan
  ADD COLUMN IF NOT EXISTS jenis_transaksi VARCHAR(20) DEFAULT 'pembayaran' NOT NULL;

ALTER TABLE public.hutang_cicilan
  DROP CONSTRAINT IF EXISTS chk_cicilan_jenis;

ALTER TABLE public.hutang_cicilan
  ADD CONSTRAINT chk_cicilan_jenis CHECK (jenis_transaksi IN ('pembayaran', 'pinjaman'));

-- 3. Fungsi pembaruan sisa hutang & status
CREATE OR REPLACE FUNCTION public.update_sisa_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_hutang_id UUID;
  v_base_pinjaman NUMERIC;
  v_additional_pinjaman NUMERIC;
  v_total_pinjaman_efektif NUMERIC;
  v_total_pembayaran NUMERIC;
  v_new_sisa NUMERIC;
  v_is_manual BOOLEAN;
  v_new_status public.status_hutang;
BEGIN
  v_hutang_id := COALESCE(NEW.hutang_id, OLD.hutang_id);

  SELECT h.total_pinjaman, COALESCE(h.is_lunas_manual, FALSE)
  INTO v_base_pinjaman, v_is_manual
  FROM public.hutang h
  WHERE h.id = v_hutang_id;

  IF v_base_pinjaman IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Hitung total pinjaman tambahan
  SELECT COALESCE(SUM(c.nominal), 0)
  INTO v_additional_pinjaman
  FROM public.hutang_cicilan c
  WHERE c.hutang_id = v_hutang_id
    AND c.jenis_transaksi = 'pinjaman';

  -- Hitung total pembayaran yang sudah masuk/keluar
  SELECT COALESCE(SUM(c.nominal), 0)
  INTO v_total_pembayaran
  FROM public.hutang_cicilan c
  WHERE c.hutang_id = v_hutang_id
    AND c.jenis_transaksi = 'pembayaran';

  v_total_pinjaman_efektif := v_base_pinjaman + v_additional_pinjaman;
  v_new_sisa := GREATEST(v_total_pinjaman_efektif - v_total_pembayaran, 0);

  -- Status Lunas:
  -- Jika ditandai manual lunas -> 'lunas'
  -- Jika sisa <= 0 dan total pinjaman > 0 -> 'lunas'
  -- Selain itu -> 'aktif'
  IF v_is_manual THEN
    v_new_status := 'lunas'::public.status_hutang;
  ELSIF v_new_sisa <= 0 AND v_total_pinjaman_efektif > 0 THEN
    v_new_status := 'lunas'::public.status_hutang;
  ELSE
    v_new_status := 'aktif'::public.status_hutang;
  END IF;

  UPDATE public.hutang
  SET
    sisa_tagihan = v_new_sisa,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = v_hutang_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Fungsi pembaruan saldo rekening dari hutang_cicilan
CREATE OR REPLACE FUNCTION public.update_saldo_rekening_cicilan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_old_tipe public.tipe_hutang;
  v_new_tipe public.tipe_hutang;
  v_old_jenis VARCHAR(20);
  v_new_jenis VARCHAR(20);
BEGIN
  -- Revert OLD balance
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.rekening_id IS NOT NULL THEN
    v_old_tipe := OLD.tipe_hutang_snapshot;
    v_old_jenis := COALESCE(OLD.jenis_transaksi, 'pembayaran');

    IF v_old_jenis = 'pinjaman' THEN
      -- Transaksi pinjaman
      IF v_old_tipe = 'menerima' THEN
        -- Menerima pinjaman menambah saldo, saat revert kurangi saldo
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini - OLD.nominal,
            updated_at = NOW()
        WHERE id = OLD.rekening_id;
      ELSIF v_old_tipe = 'memberi' THEN
        -- Memberi pinjaman mengurangi saldo, saat revert tambah saldo
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini + OLD.nominal,
            updated_at = NOW()
        WHERE id = OLD.rekening_id;
      END IF;
    ELSE
      -- Transaksi pembayaran/cicilan
      IF v_old_tipe = 'menerima' THEN
        -- Bayar hutang mengurangi saldo, saat revert tambah saldo
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini + OLD.nominal,
            updated_at = NOW()
        WHERE id = OLD.rekening_id;
      ELSIF v_old_tipe = 'memberi' THEN
        -- Terima cicilan piutang menambah saldo, saat revert kurangi saldo
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini - OLD.nominal,
            updated_at = NOW()
        WHERE id = OLD.rekening_id;
      END IF;
    END IF;
  END IF;

  -- Apply NEW balance
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.rekening_id IS NOT NULL THEN
    v_new_tipe := NEW.tipe_hutang_snapshot;
    v_new_jenis := COALESCE(NEW.jenis_transaksi, 'pembayaran');

    IF v_new_jenis = 'pinjaman' THEN
      -- Transaksi pinjaman
      IF v_new_tipe = 'menerima' THEN
        -- Menerima pinjaman: uang masuk ke rekening (+)
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini + NEW.nominal,
            updated_at = NOW()
        WHERE id = NEW.rekening_id;
      ELSIF v_new_tipe = 'memberi' THEN
        -- Memberi pinjaman: uang keluar dari rekening (-)
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini - NEW.nominal,
            updated_at = NOW()
        WHERE id = NEW.rekening_id;
      END IF;
    ELSE
      -- Transaksi pembayaran/cicilan
      IF v_new_tipe = 'menerima' THEN
        -- Bayar cicilan hutang: uang keluar dari rekening (-)
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini - NEW.nominal,
            updated_at = NOW()
        WHERE id = NEW.rekening_id;
      ELSIF v_new_tipe = 'memberi' THEN
        -- Terima cicilan piutang: uang masuk ke rekening (+)
        UPDATE public.rekening
        SET saldo_saat_ini = saldo_saat_ini + NEW.nominal,
            updated_at = NOW()
        WHERE id = NEW.rekening_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_sisa_hutang ON public.hutang_cicilan;
CREATE TRIGGER trg_update_sisa_hutang
  AFTER INSERT OR UPDATE OF nominal, hutang_id, jenis_transaksi OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_sisa_hutang();

DROP TRIGGER IF EXISTS trg_rekening_cicilan ON public.hutang_cicilan;
CREATE TRIGGER trg_rekening_cicilan
  AFTER INSERT OR UPDATE OF nominal, rekening_id, hutang_id, jenis_transaksi OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_cicilan();

COMMIT;
