-- =============================================
-- Migration 011a: Tambah kolom judul + enum correction
-- =============================================
-- JALANKAN FILE INI DULU, LALU JALANKAN 011b SETELAH INI SELESAI
-- =============================================

-- 1. Tambah field judul ke tabel transaksi
ALTER TABLE public.transaksi
  ADD COLUMN IF NOT EXISTS judul TEXT;

-- 2. Tambah tipe 'correction' ke enum
--    PostgreSQL WAJIB commit step ini dulu sebelum bisa dipakai di constraint
ALTER TYPE tipe_transaksi ADD VALUE IF NOT EXISTS 'correction';
