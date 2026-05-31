-- =============================================
-- Migration 012: Protect Rekening Delete References
-- =============================================
-- Prevent deleting an account that is still referenced by financial records.

BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_rekening_delete_when_referenced()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_reference_count INTEGER;
BEGIN
  SELECT
    (
      SELECT COUNT(*)
      FROM public.transaksi t
      WHERE t.rekening_id = OLD.id
         OR t.rekening_tujuan = OLD.id
    )
    + (
      SELECT COUNT(*)
      FROM public.hutang h
      WHERE h.rekening_id = OLD.id
    )
    + (
      SELECT COUNT(*)
      FROM public.hutang_cicilan c
      WHERE c.rekening_id = OLD.id
    )
    + (
      SELECT COUNT(*)
      FROM public.recurring_transaksi r
      WHERE r.rekening_id = OLD.id
         OR r.rekening_tujuan = OLD.id
    )
  INTO v_reference_count;

  IF v_reference_count > 0 THEN
    RAISE EXCEPTION 'Rekening masih digunakan oleh data keuangan lain. Hapus data terkait terlebih dahulu sebelum menghapus rekening.'
      USING ERRCODE = '23503';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_rekening_delete_when_referenced ON public.rekening;
CREATE TRIGGER trg_prevent_rekening_delete_when_referenced
  BEFORE DELETE ON public.rekening
  FOR EACH ROW EXECUTE FUNCTION public.prevent_rekening_delete_when_referenced();

COMMIT;
