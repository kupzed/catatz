# AI Development Rules

## General Rules

- Selalu analisa file terkait sebelum mengubah kode.
- Jangan menebak struktur database.
- Jangan mengubah migration lama yang sudah production.
- Jika perlu perubahan database, buat migration baru.
- Setiap perubahan fitur harus disertai update dokumentasi jika relevan.
- Setelah mengubah fitur, update file di `docs/features/`.
- Setelah mengubah database, update `docs/database-schema.md`, `docs/database-migrations.md`, dan `docs/rls-policies.md`.
- Setelah mengubah auth, update `docs/supabase-auth.md`.
- Setelah mengubah deployment/env, update `docs/environment-variables.md` dan `docs/deployment-vercel.md`.
- Jangan expose secret, token, service role key, atau credential.
- Gunakan Bahasa Indonesia untuk UI user-facing kecuali istilah teknis.
- Buat commit message dalam Bahasa Inggris setelah selesai.

## Project-Specific Rules

- Package manager project ini adalah npm.
- Jangan mengubah routing yang sudah ada tanpa instruksi eksplisit.
- Project memakai `src/proxy.ts`, bukan `middleware.ts`.
- Migration berada di `src/migrations`, bukan `supabase/migrations`.
- Jangan mengklaim Google OAuth atau reset password email tersedia sebelum flow tersebut benar-benar ada.
- Jangan mengklaim recurring transaction selesai sebelum UI/action aktif tersedia.
- Jangan mengklaim UI create/edit budget tersedia sebelum route/component-nya ada.
- PWA build harus tetap mempertimbangkan Serwist dan `next build --webpack`.
- POST dan traffic `/api/*` harus tetap NetworkOnly di service worker.
- Secret Gemini harus tetap di server-only env `AI_API_KEY`.
- `.env.example` boleh berisi nama variable, tetapi tidak boleh berisi value secret.

## Documentation Update Matrix

| Perubahan | Dokumentasi yang wajib dicek |
|---|---|
| Route/page/component fitur | `docs/features/*`, `docs/folder-structure.md`, `docs/server-actions-api.md` jika action berubah |
| Server Action/API Route | `docs/server-actions-api.md`, fitur terkait |
| Database schema/migration/RLS | `docs/database-schema.md`, `docs/database-migrations.md`, `docs/rls-policies.md`, `docs/security-checklist.md` |
| Auth/session/proxy | `docs/supabase-auth.md`, `docs/security-checklist.md`, `docs/troubleshooting.md` |
| Env/deployment | `docs/environment-variables.md`, `docs/deployment-vercel.md`, `README.md` jika quick start berubah |
| PWA/offline | `docs/pwa.md`, fitur terkait, `docs/security-checklist.md` jika caching berubah |
| UI guideline reusable | `docs/frontend-guidelines.md` |

## Required Final Response Format

Setiap selesai mengerjakan task, AI wajib memberikan:

1. Ringkasan perubahan
2. Daftar file yang diubah
3. Hasil validasi/test
4. Dokumentasi yang ikut di-update
5. Commit message Bahasa Inggris

## Permanent Instruction

Mulai sekarang, setiap kali mengerjakan satu task pada project ini, selalu cek apakah dokumentasi di folder `docs/` perlu diperbarui. Jika ada perubahan pada fitur, database, auth, environment variable, deployment, security, atau struktur folder, update dokumentasi terkait dalam task yang sama. Di akhir pekerjaan, selalu sertakan commit message GitHub dalam Bahasa Inggris.
