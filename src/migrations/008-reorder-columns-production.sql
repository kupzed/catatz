-- =============================================
-- Migration 008: Maintenance - Reorder Columns
-- =============================================
-- This script safely reorders columns in 'transaksi' and 'hutang'
-- by recreating the tables and migrating data within a transaction.
-- =============================================

BEGIN;

-- 1. REORDER TABLE: transaksi
---------------------------------------------------------
-- Rename old table
ALTER TABLE public.transaksi RENAME TO transaksi_old;

-- Create new table with desired column order
CREATE TABLE public.transaksi (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipe              tipe_transaksi NOT NULL,
  nominal           NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
  tanggal           DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu             TIME DEFAULT CURRENT_TIME,
  judul             TEXT,
  kategori_id       UUID REFERENCES public.kategori(id) ON DELETE SET NULL,
  rekening_id       UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
  rekening_tujuan   UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
  catatan           TEXT,
  tags              TEXT[] DEFAULT '{}',
  is_recurring      BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_id      UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_transfer CHECK (
    (tipe = 'transfer' AND rekening_tujuan IS NOT NULL)
    OR (tipe != 'transfer' AND rekening_tujuan IS NULL)
  ),
  CONSTRAINT chk_correction_judul CHECK (
    tipe != 'correction' OR judul IS NULL
  )
);

-- Copy data from old to new
INSERT INTO public.transaksi (
  id, user_id, tipe, nominal, tanggal, waktu, judul, 
  kategori_id, rekening_id, rekening_tujuan, catatan, 
  tags, is_recurring, recurring_id, created_at, updated_at
)
SELECT 
  id, user_id, tipe, nominal, tanggal, waktu, judul, 
  kategori_id, rekening_id, rekening_tujuan, catatan, 
  tags, is_recurring, recurring_id, created_at, updated_at
FROM public.transaksi_old;

-- Restore Indexes for transaksi
DROP INDEX IF EXISTS idx_transaksi_user_tanggal;
DROP INDEX IF EXISTS idx_transaksi_rekening;
DROP INDEX IF EXISTS idx_transaksi_kategori;
DROP INDEX IF EXISTS idx_transaksi_judul;

CREATE INDEX idx_transaksi_user_tanggal ON public.transaksi(user_id, tanggal DESC);
CREATE INDEX idx_transaksi_rekening    ON public.transaksi(rekening_id);
CREATE INDEX idx_transaksi_kategori    ON public.transaksi(kategori_id);
CREATE INDEX idx_transaksi_judul       ON public.transaksi(user_id, judul) WHERE judul IS NOT NULL;

-- Restore RLS for transaksi
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaksi: select own" ON public.transaksi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transaksi: insert own" ON public.transaksi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transaksi: update own" ON public.transaksi FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transaksi: delete own" ON public.transaksi FOR DELETE USING (auth.uid() = user_id);

-- Restore Trigger for transaksi
CREATE TRIGGER trg_transaksi_saldo
  AFTER INSERT OR UPDATE OR DELETE ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening();

-- Drop old table
DROP TABLE public.transaksi_old CASCADE;


-- 2. REORDER TABLE: hutang
---------------------------------------------------------
-- First, handle dependencies (hutang_cicilan)
ALTER TABLE public.hutang_cicilan RENAME TO hutang_cicilan_old;

-- Rename old table
ALTER TABLE public.hutang RENAME TO hutang_old;

-- Create new table with desired column order
CREATE TABLE public.hutang (
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

-- Copy data from old to new
INSERT INTO public.hutang (
  id, user_id, tipe, tanggal_mulai, waktu, tanggal_jatuh_tempo, 
  status, nama_entitas, rekening_id, total_pinjaman, sisa_tagihan, 
  catatan, created_at, updated_at
)
SELECT 
  id, user_id, tipe, tanggal_mulai, waktu, tanggal_jatuh_tempo, 
  status, nama_entitas, rekening_id, total_pinjaman, sisa_tagihan, 
  catatan, created_at, updated_at
FROM public.hutang_old;

-- Recreate hutang_cicilan with FK to new hutang
CREATE TABLE public.hutang_cicilan (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hutang_id   UUID NOT NULL REFERENCES public.hutang(id) ON DELETE CASCADE,
  nominal     NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu       TIME DEFAULT CURRENT_TIME,
  rekening_id UUID REFERENCES public.rekening(id) ON DELETE SET NULL,
  catatan     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Copy data for hutang_cicilan
INSERT INTO public.hutang_cicilan (
  id, hutang_id, nominal, tanggal, waktu, rekening_id, catatan, created_at
)
SELECT 
  id, hutang_id, nominal, tanggal, waktu, rekening_id, catatan, created_at
FROM public.hutang_cicilan_old;

-- Restore Indexes for hutang
DROP INDEX IF EXISTS idx_hutang_user;
DROP INDEX IF EXISTS idx_cicilan_hutang;

CREATE INDEX idx_hutang_user ON public.hutang(user_id, status);
CREATE INDEX idx_cicilan_hutang ON public.hutang_cicilan(hutang_id);

-- Restore RLS for hutang
ALTER TABLE public.hutang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hutang: select own" ON public.hutang FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "hutang: insert own" ON public.hutang FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hutang: update own" ON public.hutang FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "hutang: delete own" ON public.hutang FOR DELETE USING (auth.uid() = user_id);

-- Restore RLS for hutang_cicilan
ALTER TABLE public.hutang_cicilan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cicilan: select own" ON public.hutang_cicilan FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hutang h WHERE h.id = hutang_id AND h.user_id = auth.uid())
);
CREATE POLICY "cicilan: insert own" ON public.hutang_cicilan FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hutang h WHERE h.id = hutang_id AND h.user_id = auth.uid())
);
CREATE POLICY "cicilan: delete own" ON public.hutang_cicilan FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.hutang h WHERE h.id = hutang_id AND h.user_id = auth.uid())
);

-- Restore Triggers for hutang
CREATE TRIGGER trg_rekening_hutang
  AFTER INSERT OR UPDATE OF total_pinjaman, rekening_id OR DELETE ON public.hutang
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_hutang();

CREATE TRIGGER trg_update_sisa_hutang
  AFTER INSERT OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_sisa_hutang();

CREATE TRIGGER trg_rekening_cicilan
  AFTER INSERT OR UPDATE OF nominal, rekening_id OR DELETE ON public.hutang_cicilan
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_rekening_cicilan();

-- Drop old tables
DROP TABLE public.hutang_cicilan_old;
DROP TABLE public.hutang_old;

COMMIT;
