-- ==============================================================================
-- Migration 009: Cleanup and Reset System Categories
-- ==============================================================================
-- File ini akan menghapus semua kategori sistem yang sudah ada di database
-- lalu memasukkan ulang daftar kategori sistem yang baru.
--
-- CATATAN: Transaksi yang sebelumnya menggunakan kategori sistem lama
-- akan otomatis memiliki kategori_id = NULL karena constraint ON DELETE SET NULL.
-- ==============================================================================

ALTER TABLE public.kategori
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Hapus semua kategori sistem yang ada (tidak menyentuh kategori kustom user)
DELETE FROM public.kategori WHERE is_system = TRUE;

-- Masukkan daftar kategori sistem terbaru
INSERT INTO public.kategori (nama, ikon, warna, tipe, is_system) VALUES
  ('Gaji',         '💼', '#10b981', 'income',  TRUE),
  ('Bonus',        '🎁', '#f59e0b', 'income',  TRUE),
  ('Makan & Minum','🍔', '#f97316', 'expense', TRUE),
  ('Transportasi', '🚗', '#06b6d4', 'expense', TRUE),
  ('Kesehatan',    '🏥', '#ef4444', 'expense', TRUE),
  ('Lainnya',      '📌', '#6b7280', 'all',     TRUE);
