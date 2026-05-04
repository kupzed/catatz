-- =============================================
-- Migration 008: Fix Hutang Trigger
-- =============================================

CREATE OR REPLACE FUNCTION public.update_sisa_hutang()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_cicilan NUMERIC;
  v_total_pinjaman NUMERIC;
  v_new_sisa NUMERIC;
BEGIN
  -- Recalculate total cicilan for this hutang
  SELECT COALESCE(SUM(nominal), 0) INTO v_total_cicilan
  FROM public.hutang_cicilan
  WHERE hutang_id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  -- Fetch total_pinjaman (avoiding variable shadowing)
  SELECT total_pinjaman INTO v_total_pinjaman
  FROM public.hutang
  WHERE id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  v_new_sisa := v_total_pinjaman - v_total_cicilan;

  UPDATE public.hutang
  SET
    sisa_tagihan = GREATEST(v_new_sisa, 0),
    status = CASE WHEN v_new_sisa <= 0 THEN 'lunas'::status_hutang ELSE 'aktif'::status_hutang END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.hutang_id, OLD.hutang_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;
