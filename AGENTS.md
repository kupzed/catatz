# CatatZ - Codex Operating Instructions

## Origin

CatatZ adalah aplikasi pencatatan keuangan berbasis Next.js 16 App Router, Supabase, Server Actions, dan PWA Serwist. File ini adalah instruksi repository-level untuk Codex saat bekerja di `C:\laragon\www\catatz`.

Instruksi detail tetap berada di `docs/ai-development-rules.md`. Anggap file ini sebagai operating manual singkat yang mengikat Codex agar setiap task selesai dengan perubahan yang rapi, dokumentasi yang sinkron, validasi yang jujur, dan suggested commit message yang teknis.

## Source of Truth

Ada beberapa sumber kebenaran yang harus dipakai sebelum membuat perubahan:

- Source code saat ini adalah kebenaran utama untuk behavior aplikasi.
- `docs/` adalah kebenaran dokumentasi dan harus mengikuti behavior aktual, bukan rencana.
- `docs/ai-development-rules.md` adalah kebenaran utama untuk aturan kerja AI di repo ini.
- `src/migrations` adalah lokasi migration project ini. Jangan mengasumsikan `supabase/migrations`.
- `.env.example` hanya boleh berisi nama variable dan placeholder aman. Jangan expose nilai secret dari `.env`.

Jika dokumentasi dan source code berbeda, percaya source code dulu, lalu update dokumentasi yang relevan dalam task yang sama.

## Required Workflow

Sebelum mengubah file:

1. Cek `git status --short`.
2. Baca file terkait, termasuk dokumentasi yang relevan di `docs/`.
3. Identifikasi apakah task menyentuh fitur, database, auth, env, deployment, PWA, security, atau struktur folder.

Saat mengubah file:

- Ikuti pola kode dan struktur folder yang sudah ada.
- Jangan ubah routing yang sudah ada kecuali user meminta eksplisit.
- Jangan menambah dependency baru tanpa alasan kuat dan persetujuan user.
- Jangan mengubah migration lama yang sudah dianggap production.
- Jika perlu perubahan database, buat migration baru di `src/migrations`.
- Jangan membuat commit Git otomatis kecuali user meminta eksplisit.

Sebelum final response:

1. Cek lagi apakah `docs/` perlu diperbarui.
2. Jalankan validasi yang relevan dengan perubahan.
3. Pisahkan kegagalan yang berasal dari perubahan baru dan debt lama repo.
4. Siapkan suggested Conventional Commit message lengkap dengan subject dan body teknis.

## Documentation Contract

Setiap task wajib melewati documentation gate. Jika area berikut berubah, cek dan update dokumentasi terkait:

| Area perubahan | Dokumentasi yang wajib dicek |
|---|---|
| Route, page, component, atau UI behavior fitur | `docs/features/*`, `docs/folder-structure.md`, `docs/server-actions-api.md` jika action berubah |
| Server Action atau API Route | `docs/server-actions-api.md`, dokumen fitur terkait |
| Database schema, migration, trigger, atau RLS | `docs/database-schema.md`, `docs/database-migrations.md`, `docs/rls-policies.md`, `docs/security-checklist.md` |
| Auth, session, cookie, atau proxy | `docs/supabase-auth.md`, `docs/security-checklist.md`, `docs/troubleshooting.md` |
| Environment variable atau deployment | `docs/environment-variables.md`, `docs/deployment-vercel.md`, `README.md` jika quick start berubah |
| PWA, offline, service worker, atau cache | `docs/pwa.md`, dokumen fitur terkait, `docs/security-checklist.md` jika caching berubah |
| Reusable UI guideline | `docs/frontend-guidelines.md` |

Jangan dokumentasikan fitur yang belum benar-benar tersedia sebagai fitur selesai. Jika dokumentasi tidak perlu diubah, final response tetap harus menyebut alasannya.

## Final Response Contract

Setiap task selesai harus ditutup dengan struktur:

1. Ringkasan perubahan
2. File yang diubah
3. Validasi/test
4. Dokumentasi yang di-update atau alasan tidak perlu update
5. Suggested Conventional Commit message

Final response harus ringkas, tapi cukup teknis agar user bisa memahami apa yang berubah dan apa yang sudah divalidasi.

## Commit Message Contract

Selalu berikan suggested Conventional Commit message dalam Bahasa Inggris. Commit message harus siap dipakai di GitHub dan berisi subject plus body teknis.

Format:

```text
type(scope): imperative summary

Explain the technical change in concrete terms.

Mention important documentation, validation, migration, API, UI, or behavior impact when relevant.
```

Type utama:

- `feat` untuk fitur baru
- `fix` untuk bug fix
- `docs` untuk dokumentasi/instruksi
- `refactor` untuk perubahan struktur tanpa behavior baru
- `test` untuk test
- `chore` untuk maintenance
- `build` untuk build tooling/dependency
- `perf` untuk optimasi performa

Scope mengikuti area utama yang berubah, misalnya `workflow`, `settings`, `transactions`, `auth`, `database`, `pwa`, `docs`, atau `ui`.

Contoh:

```text
docs(workflow): document Codex task output requirements

Add repository-level Codex instructions that require each task to check whether docs need updates before returning a final response.

Clarify the final response contract and require a technical Conventional Commit suggestion with subject and body.
```

## Project Rules

- Package manager: npm.
- Build production PWA memakai `next build --webpack`.
- Project memakai `src/proxy.ts`, bukan `middleware.ts`.
- POST dan traffic `/api/*` harus tetap NetworkOnly di service worker.
- Secret Gemini harus tetap di server-only env `AI_API_KEY`.
- Gunakan Bahasa Indonesia untuk UI user-facing kecuali istilah teknis.
- Jangan mengklaim Google OAuth, reset password email, recurring transaction, atau UI create/edit budget tersedia sebelum flow tersebut benar-benar ada di kode.

## Quality and Safety

- Jangan expose secret, token, service role key, atau credential.
- Jangan revert perubahan user yang tidak terkait.
- Jangan menjalankan command destruktif tanpa instruksi eksplisit.
- Untuk perubahan frontend, pastikan UI tetap responsif, tidak overlap, dan mengikuti pola desain yang sudah ada.
- Untuk perubahan transaksi/import/database, ingat bahwa write ke `transaksi` dapat berdampak pada saldo rekening.
