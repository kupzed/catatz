-- =============================================
-- Migration 016: User-Owned Categories (Migrasi Kategori Per-User)
-- Mengubah kategori sistem global menjadi kategori milik masing-masing user
-- =============================================

DO $$
DECLARE
  u RECORD;
  sys_cat RECORD;
  new_cat_id UUID;
BEGIN
  -- 1. Iterasi setiap user yang terdaftar di profiles
  FOR u IN SELECT id FROM public.profiles LOOP

    -- Iterasi setiap kategori sistem
    FOR sys_cat IN 
      SELECT id, nama, ikon, warna, tipe 
      FROM public.kategori 
      WHERE is_system = TRUE OR user_id IS NULL 
    LOOP

      -- Cek apakah user sudah memiliki kategori dengan nama dan tipe yang sama
      SELECT id INTO new_cat_id 
      FROM public.kategori 
      WHERE user_id = u.id AND nama = sys_cat.nama AND is_system = FALSE
      LIMIT 1;

      -- Jika belum ada, buatkan salinan kategori untuk user ini
      IF new_cat_id IS NULL THEN
        INSERT INTO public.kategori (user_id, nama, ikon, warna, tipe, is_system)
        VALUES (u.id, sys_cat.nama, sys_cat.ikon, sys_cat.warna, sys_cat.tipe, FALSE)
        RETURNING id INTO new_cat_id;
      END IF;

      -- Re-point transaksi user ke kategori milik user
      UPDATE public.transaksi
      SET kategori_id = new_cat_id
      WHERE user_id = u.id AND kategori_id = sys_cat.id;

      -- Re-point budget user ke kategori milik user
      UPDATE public.budget
      SET kategori_id = new_cat_id
      WHERE user_id = u.id AND kategori_id = sys_cat.id;

      -- Re-point recurring transaksi user ke kategori milik user
      UPDATE public.recurring_transaksi
      SET kategori_id = new_cat_id
      WHERE user_id = u.id AND kategori_id = sys_cat.id;

    END LOOP;

  END LOOP;
END $$;

-- 2. Hapus kategori sistem lama setelah semua relasi dialihkan
DELETE FROM public.kategori 
WHERE is_system = TRUE OR user_id IS NULL;

-- 3. Update fungsi handle_new_user agar otomatis seed kategori untuk user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Buat profil
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Seed kategori default untuk user baru
  INSERT INTO public.kategori (user_id, nama, ikon, warna, tipe, is_system)
  VALUES
    (NEW.id, 'Gaji',          '💼', '#10b981', 'income',  FALSE),
    (NEW.id, 'Bonus',         '🎁', '#f59e0b', 'income',  FALSE),
    (NEW.id, 'Makan & Minum', '🍔', '#f97316', 'expense', FALSE),
    (NEW.id, 'Transportasi',  '🚗', '#06b6d4', 'expense', FALSE),
    (NEW.id, 'Kesehatan',     '🏥', '#ef4444', 'expense', FALSE),
    (NEW.id, 'Lainnya',       '📌', '#6b7280', 'all',     FALSE);

  RETURN NEW;
END;
$$;

-- 4. Perbarui RLS Policies di public.kategori
DROP POLICY IF EXISTS "kategori: select own and system" ON public.kategori;
DROP POLICY IF EXISTS "kategori: select own" ON public.kategori;
DROP POLICY IF EXISTS "kategori: insert own" ON public.kategori;
DROP POLICY IF EXISTS "kategori: update own" ON public.kategori;
DROP POLICY IF EXISTS "kategori: delete own" ON public.kategori;

CREATE POLICY "kategori: select own" ON public.kategori
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "kategori: insert own" ON public.kategori
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kategori: update own" ON public.kategori
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "kategori: delete own" ON public.kategori
  FOR DELETE USING (auth.uid() = user_id);
