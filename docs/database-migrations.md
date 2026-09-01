# Database Migrations

Migration project berada di `src/migrations`.

## Daftar Migration

| File | Tujuan | Status |
|---|---|---|
| `001-profiles.sql` | Membuat `profiles`, RLS profil, trigger `handle_new_user`, dan grant profil. | Active |
| `002-rekening.sql` | Membuat type `jenis_rekening`, table `rekening`, RLS, dan grant API. | Active |
| `003-kategori.sql` | Membuat table `kategori`, RLS kategori system/custom, seed kategori system, dan grant API. | Active |
| `004-transaksi.sql` | Membuat type `tipe_transaksi`, table `transaksi`, index, RLS, trigger saldo transaksi, dan grant API. | Active |
| `005-hutang.sql` | Membuat type hutang, table `hutang`, `hutang_cicilan`, RLS, trigger sisa tagihan/saldo, dan grant API. | Active |
| `006-budget.sql` | Membuat table `budget`, unique constraint, index, RLS, dan grant API. | Active |
| `007-recurring.sql` | Membuat type `interval_recurring`, table `recurring_transaksi`, RLS, dan grant API. | Active, belum terlihat UI aktif |
| `008-avatars-storage.sql` | Membuat bucket storage `avatars` dan policy storage object. | Active |
| `009-user-preferences.sql` | Membuat table `user_preferences`, index, RLS, dan grant API untuk preferensi user. | Active |
| `010-user-sessions.sql` | Membuat table `user_sessions`, index, RLS, dan grant API untuk tracking sesi aktif. | Active |
| `011-hutang-cicilan-balance-safety.sql` | Menambah snapshot tipe cicilan, policy UPDATE cicilan, dan memperbaiki trigger saldo/sisa hutang saat cicilan diubah atau parent dihapus. | Active |
| `012-protect-rekening-delete-references.sql` | Menambah trigger untuk menolak delete rekening yang masih direferensikan transaksi, hutang/piutang, cicilan, atau template transaksi berulang. | Active |
| `013-extend-user-preferences-formatting.sql` | Menambah preferensi `show_decimal_places` dan `time_format` pada `user_preferences`. | Active |
| `014-fix-default-landing-page-values.sql` | Mengubah nilai default column `default_landing_page` ke `/transactions` dan memigrasikan nilai landing page lama ke nama route baru. | Active |

## Catatan Urutan

File migration yang ada saat ini berurutan dari `001` sampai `014` di `src/migrations`.

Jangan menjalankan migration otomatis hanya berdasarkan asumsi nomor file tanpa review. Pastikan urutan eksekusi sesuai riwayat production/staging yang sebenarnya.

## Aturan Membuat Migration Baru

- Jangan mengubah migration lama yang sudah pernah dijalankan di production.
- Buat file migration baru untuk perubahan schema, RLS, trigger, function, enum, index, storage, atau grant.
- Gunakan nama file yang urut dan deskriptif.
- Test di local/staging sebelum production.
- Pastikan migration aman untuk data existing.
- Untuk perubahan besar, buat backup terlebih dahulu.
- Jangan drop column/table tanpa backup, validasi data, dan rollback plan.
- Setelah migration baru dibuat, update:
  - [Database Schema](./database-schema.md)
  - [Database Migrations](./database-migrations.md)
  - [RLS Policies](./rls-policies.md)
  - [Security Checklist](./security-checklist.md) jika relevan

## Aturan Production Database

- Jalankan migration production pada window maintenance jika ada operasi berat.
- Review query yang melakukan recreate table, rename table, atau drop table.
- Pastikan trigger dan RLS dipulihkan setelah operasi recreate table.
- Pastikan grant API masih sesuai setelah table dibuat ulang.
- Simpan hasil migration log untuk audit.

## Rollback Notes

Migration saat ini tidak menyediakan file rollback eksplisit.

Untuk rollback production:

- Gunakan backup database atau point-in-time recovery Supabase jika tersedia.
- Hindari rollback manual parsial tanpa memahami trigger/RLS/grant terkait.
- Untuk perubahan data destructive, siapkan script recovery sebelum migration dijalankan.

## Pre-production Checklist

- [ ] Migration sudah direview.
- [ ] Backup tersedia.
- [ ] Migration sudah dites di local/staging.
- [ ] Data existing aman.
- [ ] RLS dan policy tetap aktif setelah migration.
- [ ] Trigger/function tetap ada setelah migration.
- [ ] Grant API untuk role `authenticated`/`anon` sesuai kebutuhan.
- [ ] Aplikasi berhasil build terhadap schema baru.
- [ ] Dokumentasi database sudah diupdate.
