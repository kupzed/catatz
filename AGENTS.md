# CatatZ - Codex Operating Instructions

## Origin

CatatZ adalah aplikasi pencatatan keuangan berbasis Next.js 16 App Router, Supabase, Server Actions, dan PWA Serwist. File ini adalah instruksi repository-level untuk agent saat bekerja dari root repository CatatZ.

Instruksi detail tetap berada di `docs/ai-development-rules.md`. Anggap file ini sebagai operating manual singkat yang mengikat Codex agar setiap task selesai dengan perubahan yang rapi, dokumentasi yang sinkron, validasi yang jujur, dan suggested commit message yang teknis.

## Source of Truth

Ada beberapa sumber kebenaran yang harus dipakai sebelum membuat perubahan:

- Source code saat ini adalah kebenaran utama untuk behavior aplikasi.
- `docs/` adalah kebenaran dokumentasi dan harus mengikuti behavior aktual, bukan rencana.
- `docs/ai-development-rules.md` adalah kebenaran utama untuk aturan kerja AI di repo ini.
- **`DESIGN.md` adalah kebenaran utama untuk semua keputusan visual, design token, dan component styling.**
- `docs/frontend-guidelines.md` adalah kebenaran implementasi desain di codebase ini (adaptasi DESIGN.md ke Tailwind/shadcn).
- `src/migrations` adalah lokasi migration project ini. Jangan mengasumsikan `supabase/migrations`.
- `.env.example` hanya boleh berisi nama variable dan placeholder aman. Jangan expose nilai secret dari `.env`.

Jika dokumentasi dan source code berbeda, percaya source code dulu, lalu update dokumentasi yang relevan dalam task yang sama.

## ECC Workflow Overlay

CatatZ memakai subset Everything Claude Code (ECC) secara project-local untuk Codex dan Claude Code.

- `.agents/skills/` adalah canonical skill surface. `.claude/skills/` hanya berisi wrapper kompatibilitas yang menunjuk ke canonical skill.
- Gunakan skills `coding-standards`, `frontend-patterns`, `security-review`, `verification-loop`, `documentation-lookup`, `strategic-compact`, `agent-introspection-debugging`, `product-capability`, `tdd-workflow`, dan `e2e-testing` sesuai task.
- `nextjs-turbopack` adalah library reference, bukan aturan production build. Production CatatZ tetap memakai `next build --webpack` untuk Serwist.
- Specialized agents di `.codex/agents/` dan `.claude/agents/` bersifat read-only. Main agent adalah satu-satunya pihak yang boleh mengedit file.
- Hooks project memblokir command destruktif dan perubahan secret file, tetapi quality check hanya warning. CI tetap menjadi enforcement utama.
- Memory hook hanya boleh menyimpan metadata di `.ecc/runtime/`: path file, status verifikasi, timestamp, dan identifier sesi yang sudah di-hash. Jangan simpan prompt, tool arguments, isi file, secret, atau data finansial.
- MCP project hanya `chrome-devtools`. Jangan tambahkan Supabase, database production, GitHub, memory, atau connector lain tanpa review eksplisit.

Workflow default:

1. Fitur/refactor kompleks: planner -> TDD -> implementasi main agent.
2. Setelah perubahan: code review; tambahkan security review untuk auth, RLS, input, upload, Server Actions, secret, atau data sensitif.
3. Jalankan `npm run verify:quick` selama iterasi dan `npm run verify` sebelum PR jika browser Playwright tersedia.
4. Target 80% berlaku untuk kode baru/diubah dan modul pure yang dimasukkan ke coverage, bukan klaim coverage global legacy code.

## Design Contract

**WAJIB dibaca sebelum menyentuh file UI apapun.**

`DESIGN.md` adalah sistem desain institusional berbasis Coinbase brand. Setiap perubahan tampilan — komponen baru, styling baru, halaman baru — HARUS mengikuti aturan berikut:

### Token Warna

| Token CSS | Nilai | Gunakan untuk |
|---|---|---|
| `bg-primary` / `text-primary` | #0052ff | CTA utama, active state nav, accent link |
| `bg-surface-dark` | #0a0b0d | Dark hero card, editorial band |
| `bg-surface-dark-elevated` | #16181c | Card di atas dark background |
| `bg-surface-soft` | #f7f7f7 | Alternating band, muted section background |
| `bg-surface-strong` | #eef0f3 | Secondary button bg, badge bg, icon plate |
| `text-semantic-up` | #05b169 | Pemasukan / nilai positif — **text only, jangan pakai sebagai bg** |
| `text-semantic-down` | #cf202f | Pengeluaran / nilai negatif — **text only, jangan pakai sebagai bg** |
| `border-hairline` | #dee1e6 | Default border/divider pada surface terang |

### Shape Rules

- **Semua CTA button WAJIB `rounded-full` (pill).** Tidak ada pengecualian.
- **Card/container menggunakan `rounded-[24px]` atau `rounded-card`.** Bukan `rounded-xl` default shadcn.
- **Form input menggunakan `rounded-[12px]` atau `rounded-input`, height `h-12`.**
- **Badge/tag menggunakan `rounded-full` (pill).**
- Jangan pakai `rounded-none` (0px) pada komponen interaktif.

### Typography Rules

- **Font utama: Inter** (diimpor via `next/font/google`, variable `--font-inter`).
- **Font monospace/angka: Geist Mono** (variable `--font-geist-mono`) — gunakan `font-mono` untuk semua nominal keuangan.
- **Heading display (`h1`): `text-[32px] font-normal tracking-[-0.4px]`** — JANGAN `font-bold` untuk page title utama.
- **Section title: `text-lg font-semibold`** atau sesuai hirarki yang sudah ada.
- **Semua angka nominal keuangan WAJIB `font-mono`.**

### Elevation & Shadow Rules

- **Default state: FLAT.** Tidak ada `shadow-md`, `shadow-lg` pada komponen default.
- **Hover state: satu tier shadow saja** — `hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]`.
- **Separation menggunakan `border-hairline`**, bukan shadow.
- Dark card menggunakan `ring-1 ring-white/5` sebagai visual separator tipis.

### Color Usage Rules

- `bg-primary` (Coinbase Blue) **HEMAT** — hanya untuk CTA utama, active nav, inline accent.
- `text-semantic-up` dan `text-semantic-down` **hanya untuk text**, jangan pernah sebagai background button.
- Di dark background, gunakan `bg-surface-dark-elevated` untuk card agar ada kontras dari page background.
- Dark mode dan light mode HARUS punya perbedaan visual yang jelas pada dark card — gunakan `dark:bg-surface-dark-elevated` saat light mode pakai `bg-surface-dark`.

### Checklist Sebelum Submit UI Change

Sebelum submit perubahan yang menyentuh UI, pastikan:

- [ ] Semua CTA button sudah `rounded-full`
- [ ] Tidak ada shadow berlebihan di default state
- [ ] Angka keuangan menggunakan `font-mono`
- [ ] Warna menggunakan CSS token, bukan hex hardcoded (kecuali yang belum ada tokennya)
- [ ] Tampilan di light mode dan dark mode sudah dicek berbeda secara visual
- [ ] Tidak ada teks yang truncate/overflow di mobile (min-width, break-words, dll.)
- [ ] Responsive: cek mobile `< 640px` dan desktop `> 1024px`

## Required Workflow

Sebelum mengubah file:

1. Cek `git status --short`.
2. Baca file terkait, termasuk dokumentasi yang relevan di `docs/`.
3. Identifikasi apakah task menyentuh fitur, database, auth, env, deployment, PWA, security, struktur folder, **atau UI/styling**.
4. **Jika task menyentuh UI/styling**: baca seksi yang relevan di `DESIGN.md` dan `docs/frontend-guidelines.md` sebelum mulai.

Saat mengubah file:

- Ikuti pola kode dan struktur folder yang sudah ada.
- **Untuk UI: ikuti Design Contract di atas.**
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
| **Komponen UI, styling, token warna, atau desain** | **`DESIGN.md`** (acuan), **`docs/frontend-guidelines.md`** (implementasi) |
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

Scope mengikuti area utama yang berubah, misalnya `workflow`, `settings`, `transactions`, `auth`, `database`, `pwa`, `docs`, `ui`, atau `design`.

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
- **Untuk perubahan UI: wajib ikuti Design Contract. UI harus responsif, tidak overlap, tidak ada teks truncate di mobile, dan mengikuti DESIGN.md.**
- Untuk perubahan transaksi/import/database, ingat bahwa write ke `transaksi` dapat berdampak pada saldo rekening.
