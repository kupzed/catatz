-- =============================================
-- Migration 009: API Access Grants
-- Supabase v1.26.05+ requires explicit GRANT for PostgREST access
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Grant USAGE on schema public
-- Allows API roles (anon, authenticated) to access the schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant permissions on tables

-- Profiles: accessed by authenticated users (SELECT, UPDATE)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Rekening: accessed by authenticated users (CRUD)
GRANT ALL ON public.rekening TO authenticated;

-- Kategori: system categories can be read by anon, custom categories managed by authenticated (CRUD)
GRANT SELECT ON public.kategori TO anon;
GRANT ALL ON public.kategori TO authenticated;

-- Transaksi: accessed by authenticated users (CRUD)
GRANT ALL ON public.transaksi TO authenticated;

-- Hutang & Hutang Cicilan: accessed by authenticated users (CRUD)
GRANT ALL ON public.hutang TO authenticated;
GRANT ALL ON public.hutang_cicilan TO authenticated;

-- Budget: accessed by authenticated users (CRUD)
GRANT ALL ON public.budget TO authenticated;

-- Recurring Transaksi: accessed by authenticated users (CRUD)
GRANT ALL ON public.recurring_transaksi TO authenticated;

-- 3. Grant USAGE on sequences
-- Allows auto-incrementing IDs and sequences to work properly for API roles
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
