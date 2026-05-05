-- =============================================
-- Migration 009: Field Waktu dan Rekening Hutang
-- =============================================

-- Tambah field waktu di tabel transaksi
ALTER TABLE public.transaksi 
ADD COLUMN IF NOT EXISTS waktu TIME DEFAULT CURRENT_TIME;

-- Tambah field waktu dan rekening di tabel hutang
ALTER TABLE public.hutang 
ADD COLUMN IF NOT EXISTS waktu TIME DEFAULT CURRENT_TIME,
ADD COLUMN IF NOT EXISTS rekening_id UUID REFERENCES public.rekening(id) ON DELETE SET NULL;

-- Tambah field waktu dan rekening di tabel hutang_cicilan
ALTER TABLE public.hutang_cicilan 
ADD COLUMN IF NOT EXISTS waktu TIME DEFAULT CURRENT_TIME,
ADD COLUMN IF NOT EXISTS rekening_id UUID REFERENCES public.rekening(id) ON DELETE SET NULL;
