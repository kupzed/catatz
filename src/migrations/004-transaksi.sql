-- =============================================
-- Migration 004: Transaksi (Transactions)
-- =============================================

CREATE TYPE tipe_transaksi AS ENUM ('income', 'expense', 'transfer', 'correction');

CREATE TABLE IF NOT EXISTS public.transaksi (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipe              tipe_transaksi NOT NULL,
  nominal           NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
  tanggal           DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu             TIME DEFAULT CURRENT_TIME,
  judul             TEXT,
  kategori_id       UUID REFERENCES public.kategori(id) ON DELETE SET NULL,
  rekening_id       UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
  rekening_tujuan   UUID REFERENCES public.rekening(id) ON DELETE SET NULL,  -- only for transfer
  catatan           TEXT,
  tags              TEXT[] DEFAULT '{}',
  is_recurring      BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_id      UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: transfer must have rekening_tujuan, non-transfer must not
  CONSTRAINT chk_transfer CHECK (
    (tipe = 'transfer' AND rekening_tujuan IS NOT NULL)
    OR (tipe != 'transfer' AND rekening_tujuan IS NULL)
  ),
  -- Constraint: correction must not have judul (handled in action layer)
  CONSTRAINT chk_correction_judul CHECK (
    tipe != 'correction' OR judul IS NULL
  )
);

-- Index for common query patterns
CREATE INDEX idx_transaksi_user_tanggal ON public.transaksi(user_id, tanggal DESC);
CREATE INDEX idx_transaksi_rekening    ON public.transaksi(rekening_id);
CREATE INDEX idx_transaksi_kategori    ON public.transaksi(kategori_id);
CREATE INDEX idx_transaksi_judul       ON public.transaksi(user_id, judul) WHERE judul IS NOT NULL;

ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transaksi: select own" ON public.transaksi
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transaksi: insert own" ON public.transaksi
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transaksi: update own" ON public.transaksi
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transaksi: delete own" ON public.transaksi
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Trigger: Auto-update saldo_saat_ini on rekening
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
    -- 'correction': bypass auto-update (handled manually in action layer)

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
    -- 'correction': bypass auto-update

  -- === ON UPDATE ===
  ELSIF (TG_OP = 'UPDATE') THEN
    -- First, reverse the OLD transaction (if not correction)
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

    -- Then apply the NEW transaction (if not correction)
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
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_transaksi_saldo
  AFTER INSERT OR UPDATE OR DELETE ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening();

-- Grant API access (Supabase v1.26.05+)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaksi TO authenticated;
