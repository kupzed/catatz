-- =============================================
-- Migration 011b: Constraints + Trigger update
-- =============================================
-- JALANKAN SETELAH 011a BERHASIL DIJALANKAN
-- (PostgreSQL harus commit enum 'correction' dulu sebelum bisa dipakai di constraint)
-- =============================================

-- 3. Update constraint transfer
--    (tidak merujuk 'correction' secara langsung, aman dalam satu eksekusi)
ALTER TABLE public.transaksi DROP CONSTRAINT IF EXISTS chk_transfer;
ALTER TABLE public.transaksi ADD CONSTRAINT chk_transfer CHECK (
  (tipe = 'transfer' AND rekening_tujuan IS NOT NULL)
  OR (tipe != 'transfer' AND rekening_tujuan IS NULL)
);

-- 4. Constraint: correction harus judul = NULL
--    (menggunakan 'correction' secara eksplisit, harus SETELAH commit step 011a)
ALTER TABLE public.transaksi DROP CONSTRAINT IF EXISTS chk_correction_judul;
ALTER TABLE public.transaksi ADD CONSTRAINT chk_correction_judul CHECK (
  tipe != 'correction' OR judul IS NULL
);

-- 5. Index untuk pencarian judul
DROP INDEX IF EXISTS idx_transaksi_judul;
CREATE INDEX idx_transaksi_judul ON public.transaksi(user_id, judul)
  WHERE judul IS NOT NULL;

-- =============================================
-- 6. Update trigger: tipe 'correction' bypass saldo otomatis
-- =============================================
CREATE OR REPLACE FUNCTION public.update_saldo_rekening()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- === ON INSERT ===
  IF (TG_OP = 'INSERT') THEN
    IF NEW.tipe = 'income' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_id;
    ELSIF NEW.tipe = 'expense' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_id;
    ELSIF NEW.tipe = 'transfer' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_id;
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_tujuan;
    END IF;
    -- 'correction': saldo sudah diatur langsung di action layer, trigger tidak berbuat apa-apa

  -- === ON DELETE ===
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.tipe = 'income' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_id;
    ELSIF OLD.tipe = 'expense' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_id;
    ELSIF OLD.tipe = 'transfer' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_id;
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_tujuan;
    END IF;
    -- 'correction' delete: saldo dibalik secara manual di action layer

  -- === ON UPDATE ===
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Reverse transaksi lama (skip correction)
    IF OLD.tipe = 'income' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_id;
    ELSIF OLD.tipe = 'expense' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_id;
    ELSIF OLD.tipe = 'transfer' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_id;
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - OLD.nominal, updated_at = NOW()
      WHERE id = OLD.rekening_tujuan;
    END IF;
    -- Apply transaksi baru (skip correction)
    IF NEW.tipe = 'income' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_id;
    ELSIF NEW.tipe = 'expense' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_id;
    ELSIF NEW.tipe = 'transfer' THEN
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini - NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_id;
      UPDATE public.rekening SET saldo_saat_ini = saldo_saat_ini + NEW.nominal, updated_at = NOW()
      WHERE id = NEW.rekening_tujuan;
    END IF;
    -- 'correction': tidak diproses trigger sama sekali
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
