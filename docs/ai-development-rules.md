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
- Buat suggested Conventional Commit message dalam Bahasa Inggris setelah selesai.
- Jangan membuat commit Git otomatis kecuali user meminta eksplisit.
- Gunakan `.agents/skills/` sebagai canonical skill surface dan jangan menduplikasi isi skill ke `.claude/skills/`.
- Specialized agent hanya boleh membaca dan menganalisis. Main agent adalah satu-satunya pihak yang mengedit file.
- Jangan mengaktifkan MCP database production. MCP project yang diizinkan saat ini hanya Chrome DevTools.
- Memory workflow hanya boleh menyimpan metadata yang diizinkan di `docs/ecc-workflow.md`.

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
| Agent workflow, skills, hooks, tests, CI, atau MCP | `docs/ecc-workflow.md`, `docs/folder-structure.md`, `README.md` jika command berubah |

## Testing dan Verification

- Fitur, bug fix, dan refactor harus dimulai dari test yang gagal jika behavior dapat diuji secara otomatis.
- Vitest digunakan untuk unit test dan komponen sinkron. Async Server Components dan critical browser flows diuji dengan Playwright.
- Supabase dan Gemini harus dimock sampai tersedia project Supabase test khusus. Jangan gunakan production database sebagai test target.
- Target 80% berlaku untuk kode baru/diubah dan modul pure yang tercantum pada coverage baseline. Jangan mengklaim coverage global legacy code.
- Gunakan `npm run verify:quick` untuk iterasi dan `npm run verify` sebelum PR jika browser Playwright tersedia.

## Required Final Response Format

Setiap selesai mengerjakan task, AI wajib memberikan:

1. Ringkasan perubahan
2. Daftar file yang diubah
3. Hasil validasi/test
4. Dokumentasi yang ikut di-update atau alasan dokumentasi tidak perlu diubah
5. Suggested Conventional Commit message lengkap dalam Bahasa Inggris

## Conventional Commit Rules

- Commit message harus siap dipakai di GitHub dan berisi subject plus body teknis.
- Format commit message:

```text
type(scope): imperative summary

Explain the technical change in concrete terms.

Mention important documentation, validation, migration, API, UI, or behavior impact when relevant.
```

- Gunakan Bahasa Inggris.
- Gunakan summary berbentuk imperative, singkat, dan jelas.
- Type utama yang digunakan: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `perf`.
- Scope mengikuti area utama yang berubah, misalnya `docs`, `settings`, `transactions`, `pwa`, `auth`, `database`, atau `workflow`.
- Body commit harus menjelaskan perubahan teknis secara konkret, termasuk dampak pada dokumentasi, validasi, migration, API, UI, atau behavior jika relevan.
- Jangan mencantumkan secret, credential, token, atau detail sensitif di commit message.

Contoh:

```text
docs(workflow): document Codex output requirements

Add repository-level instructions that require each task to check whether CatatZ documentation needs updates before returning a final response.

Clarify the final response contract and require a technical Conventional Commit suggestion with subject and body.
```

## Permanent Instruction

Mulai sekarang, setiap kali mengerjakan satu task pada project ini, selalu cek apakah dokumentasi di folder `docs/` perlu diperbarui. Jika ada perubahan pada fitur, database, auth, environment variable, deployment, security, atau struktur folder, update dokumentasi terkait dalam task yang sama. Di akhir pekerjaan, selalu sertakan suggested Conventional Commit message lengkap dalam Bahasa Inggris, termasuk body teknis.

Root `AGENTS.md` mengikat aturan ini sebagai instruksi repository-level untuk Codex. Jika ada perbedaan, ikuti aturan yang paling spesifik untuk task yang sedang dikerjakan dan tetap jaga dokumentasi `docs/` tetap sesuai perubahan aktual.
