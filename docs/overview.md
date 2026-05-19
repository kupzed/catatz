# Project Overview

## Deskripsi

CatatZ adalah aplikasi fullstack untuk pencatatan keuangan pribadi. Frontend dibangun dengan Next.js App Router, sedangkan backend data menggunakan Supabase Auth, Supabase PostgreSQL, dan Supabase Storage.

Aplikasi saat ini berfokus pada pencatatan transaksi harian, pengelolaan rekening, kategori, hutang/piutang, rekap keuangan, pengaturan profil, export PDF, dan pengalaman PWA.

## Tujuan

- Membantu user mencatat pemasukan, pengeluaran, transfer, dan koreksi saldo.
- Menyediakan ringkasan keuangan pribadi yang mudah dipantau.
- Menjaga data antar user tetap terisolasi dengan Supabase Auth dan RLS.
- Memberikan pengalaman app-like melalui PWA, install prompt, offline shell, dan offline queue untuk aksi transaksi.

## Target Penggunaan

- Pengguna individu yang ingin mencatat keuangan pribadi.
- Pengguna yang membutuhkan pemisahan rekening seperti tunai, bank, e-wallet, dan investasi.
- Pengguna yang ingin melacak hutang/piutang dan cicilan.
- Pengguna yang ingin export laporan transaksi ke PDF.

## Fitur Utama

- Auth email/password dengan verifikasi email Supabase.
- Protected dashboard untuk user yang sudah login.
- CRUD transaksi: income, expense, transfer, dan correction.
- Offline queue untuk create, update, dan delete transaksi.
- Input suara transaksi menggunakan browser Speech Recognition dan Gemini API melalui server action.
- CRUD rekening dan koreksi saldo berbasis transaksi correction.
- CRUD kategori custom dan kategori system read-only.
- Hutang/piutang, cicilan, detail/edit/hapus cicilan, pelunasan dengan pilihan rekening, dan progress pembayaran.
- Rekap pemasukan/pengeluaran bulanan, breakdown kategori, dan budget usage jika data budget tersedia.
- Settings profil, avatar, password, tema, dan export PDF.
- PWA manifest, icons, iOS metadata, service worker, offline fallback, install banner, dan update prompt.

## Modul Utama

- Auth: `src/app/(auth)`, `src/actions/auth-action.ts`, `src/app/auth/callback/route.ts`.
- Dashboard shell: `src/app/(dashboard)/layout.tsx`, `src/components/common/app-sidebar.tsx`.
- Transaksi: `src/app/(dashboard)/transaksi`, `src/actions/transaksi-action.ts`.
- Rekening: `src/app/(dashboard)/rekening`, `src/actions/rekening-action.ts`.
- Kategori: `src/app/(dashboard)/kategori`, `src/actions/kategori-action.ts`.
- Hutang/Piutang: `src/app/(dashboard)/hutang`, `src/actions/hutang-action.ts`.
- Rekap/Laporan: `src/app/(dashboard)/rekap`, `src/actions/rekap-action.ts`, `src/actions/export-action.ts`, `src/lib/pdf-generator.ts`.
- Settings: `src/app/(dashboard)/settings`, `src/actions/profile-action.ts`, `src/actions/auth-action.ts`.
- Supabase config: `src/configs/supabase`.
- Database migrations: `src/migrations`.
- PWA: `src/app/sw.ts`, `src/lib/sw-register.ts`, `src/components/pwa`, `public/manifest.json`.

## Status Project

Status: aktif dikembangkan.

Catatan status aktual:

- Fitur recurring transaction sudah memiliki table `recurring_transaksi`, type `IntervalRecurring`, dan field transaksi terkait, tetapi belum terlihat ada UI/flow aktif untuk mengelola recurring transaction.
- Fitur budget memiliki table `budget`, action `upsertBudget`, dan tampilan usage di halaman rekap jika data budget tersedia. UI pembuatan/edit budget belum terlihat di route yang ada.
- Reset password email tersedia melalui `/forgot-password` dan `/reset-password`.
- Google OAuth tersedia untuk login/register, dan Google Link Identity tersedia dari Settings Akun Terhubung.
- Tidak ada folder `supabase/` CLI. Migration SQL project berada di `src/migrations`.
