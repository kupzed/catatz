-- =============================================
-- Migration 014: Fix Default Landing Page Values
-- Migrates legacy Indonesian route paths to English route paths.
-- =============================================

-- Update column default for new records
ALTER TABLE public.user_preferences
  ALTER COLUMN default_landing_page SET DEFAULT '/transactions';

-- Migrate existing rows to corresponding English route paths
UPDATE public.user_preferences
SET default_landing_page = CASE default_landing_page
  WHEN '/transaksi' THEN '/transactions'
  WHEN '/rekening' THEN '/wallets'
  WHEN '/rekap' THEN '/reports'
  WHEN '/hutang' THEN '/debts'
  WHEN '/kategori' THEN '/categories'
  ELSE '/transactions'
END,
updated_at = NOW()
WHERE default_landing_page IN ('/transaksi', '/rekening', '/rekap', '/hutang', '/kategori');
