# CatatZ - Codex Operating Instructions

## Origin

CatatZ adalah aplikasi pencatatan keuangan berbasis Next.js 16 App Router, Supabase, Server Actions, dan PWA Serwist. File ini adalah instruksi repository-level untuk agent saat bekerja dari root repository CatatZ.

Instruksi detail tetap berada di `docs/ai-development-rules.md`. Anggap file ini sebagai operating manual singkat yang mengikat Codex agar setiap task selesai dengan perubahan yang rapi, dokumentasi yang sinkron, validasi yang jujur, dan suggested commit message yang teknis.

## Production Status & Mandate

> **STATUS PROJECT: PRODUCTION (LIVE)**
>
> CatatZ adalah aplikasi pencatatan keuangan pribadi yang **sudah aktif di tahap production (live)**. Aplikasi ini melayani pencatatan data finansial riil pengguna.
>
> Setiap model LLM dan AI agent (Codex, Claude, Gemini, Antigravity, dsb.) yang bekerja pada repository ini **WAJIB memperlakukan codebase ini sebagai sistem production-grade**:
>
> 1. **Zero-Destructive / Safe Changes**: Codebase ini bukan sandbox, draft, atau prototype. Dilarang melakukan operasi destruktif, menghapus/mengubah struktur database sembarangan, mereset database, atau mengubah migration SQL lama (`src/migrations/001-*.sql` s/d `014-*.sql`) yang sudah berjalan di production. Perubahan schema baru WAJIB berupa migration baru yang additive dan backward-compatible.
> 2. **Financial Data Integrity**: Perhitungan saldo rekening, transaksi, cicilan hutang/piutang, dan koreksi saldo berdampak langsung pada saldo uang riil pengguna. Database trigger dan invariant perhitungan saldo wajib dipatuhi tanpa kompromi.
> 3. **Backward Compatibility**: Jangan mengubah routing yang ada (`/transactions`, `/wallets`, `/reports`, `/debts`, `/categories`, `/settings`), Server Action signatures, auth cookie mechanisms, atau RLS policies tanpa backward compatibility.
> 4. **Production Security Mandate**: Jaga RLS Supabase di setiap query/tabel, pastikan secret (`AI_API_KEY`, credential) tetap server-only, cookie auth selalu `secure: environment.isProduction`, dan sanitasi seluruh input user.
> 5. **Production Build & Verification Gate**: PWA build harus tetap memakai `next build --webpack` untuk Serwist. Setiap task WAJIB divalidasi dengan `npm run verify:quick` (lint, typecheck, unit test) dan memastikan tidak ada regresi sebelum menyatakan task selesai.

## Source of Truth

Ada beberapa sumber kebenaran yang harus dipakai sebelum membuat perubahan:

- Source code saat ini adalah kebenaran utama untuk behavior aplikasi.
- `docs/` adalah kebenaran dokumentasi dan harus mengikuti behavior aktual, bukan rencana.
- `docs/ai-development-rules.md` adalah kebenaran utama untuk aturan kerja AI di repo ini.
- **`DESIGN.md` adalah kebenaran utama untuk semua keputusan visual, design token, dan component styling.**
- `docs/frontend-guidelines.md` adalah kebenaran implementasi desain di codebase ini (adaptasi DESIGN.md ke Tailwind/shadcn).
- `src/i18n/` adalah kebenaran utama untuk teks UI bilingual (`id.ts`, `en.ts`), tipe `Dictionary`, dan konvensi lokalisasi.
- `src/migrations` adalah lokasi migration project ini. Jangan mengasumsikan `supabase/migrations`.
- `.env.example` hanya boleh berisi nama variable dan placeholder aman. Jangan expose nilai secret dari `.env`.

Jika dokumentasi dan source code berbeda, percaya source code dulu, lalu update dokumentasi yang relevan dalam task yang sama.

## ECC Workflow Overlay

CatatZ memakai subset Everything Claude Code (ECC) secara project-local untuk Codex dan Claude Code.

- `.agents/skills/` adalah canonical skill surface. `.claude/skills/` hanya berisi wrapper kompatibilitas yang menunjuk ke canonical skill.
- Gunakan skills `coding-standards`, `frontend-patterns`, `security-review`, `security-audit`, `verification-loop`, `documentation-lookup`, `strategic-compact`, `agent-introspection-debugging`, `product-capability`, `tdd-workflow`, dan `e2e-testing` sesuai task.
- `nextjs-turbopack` adalah library reference, bukan aturan production build. Production CatatZ tetap memakai `next build --webpack` untuk Serwist.
- Specialized agents di `.codex/agents/` dan `.claude/agents/` bersifat read-only. Main agent adalah satu-satunya pihak yang boleh mengedit file.
- Hooks project memblokir command destruktif dan perubahan secret file, tetapi quality check hanya warning. CI tetap menjadi enforcement utama.
- Memory hook hanya boleh menyimpan metadata di `.ecc/runtime/`: path file, status verifikasi, timestamp, dan identifier sesi yang sudah di-hash. Jangan simpan prompt, tool arguments, isi file, secret, atau data finansial.
- MCP project yang diizinkan adalah `chrome-devtools` dan `codegraph` (local code intelligence graph). Jangan tambahkan Supabase, database production, GitHub, memory, atau connector lain tanpa review eksplisit.

Workflow default:

1. Fitur/refactor kompleks: planner -> TDD -> implementasi main agent.
2. Setelah perubahan: code review; tambahkan security review untuk auth, RLS, input, upload, Server Actions, secret, atau data sensitif.
3. Jalankan `npm run verify:quick` selama iterasi dan `npm run verify` sebelum PR.
4. Target 80% berlaku untuk kode baru/diubah dan modul pure yang dimasukkan ke coverage, bukan klaim coverage global legacy code.

## Design Contract

**WAJIB dibaca sebelum menyentuh file UI apapun.**

`DESIGN.md` adalah sistem desain institusional berbasis Coinbase brand. Setiap perubahan tampilan — komponen baru, styling baru, halaman baru — HARUS mengikuti aturan berikut:

### Token Warna

| Token CSS                     | Nilai   | Gunakan untuk                                                        |
| ----------------------------- | ------- | -------------------------------------------------------------------- |
| `bg-primary` / `text-primary` | #0052ff | CTA utama, active state nav, accent link                             |
| `bg-surface-dark`             | #0a0b0d | Dark hero card, editorial band                                       |
| `bg-surface-dark-elevated`    | #16181c | Card di atas dark background                                         |
| `bg-surface-soft`             | #f7f7f7 | Alternating band, muted section background                           |
| `bg-surface-strong`           | #eef0f3 | Secondary button bg, badge bg, icon plate                            |
| `text-semantic-up`            | #05b169 | Pemasukan / nilai positif — **text only, jangan pakai sebagai bg**   |
| `text-semantic-down`          | #cf202f | Pengeluaran / nilai negatif — **text only, jangan pakai sebagai bg** |
| `border-hairline`             | #dee1e6 | Default border/divider pada surface terang                           |

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

| Area perubahan                                     | Dokumentasi yang wajib dicek                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Route, page, component, atau UI behavior fitur     | `docs/features/*`, `docs/folder-structure.md`, `docs/server-actions-api.md` jika action berubah                |
| **Komponen UI, styling, token warna, atau desain** | **`DESIGN.md`** (acuan), **`docs/frontend-guidelines.md`** (implementasi)                                      |
| Server Action atau API Route                       | `docs/server-actions-api.md`, dokumen fitur terkait                                                            |
| Database schema, migration, trigger, atau RLS      | `docs/database-schema.md`, `docs/database-migrations.md`, `docs/rls-policies.md`, `docs/security-checklist.md` |
| Auth, session, cookie, atau proxy                  | `docs/supabase-auth.md`, `docs/security-checklist.md`, `docs/troubleshooting.md`                               |
| Environment variable atau deployment               | `docs/environment-variables.md`, `docs/deployment-vercel.md`, `README.md` jika quick start berubah             |
| PWA, offline, service worker, atau cache           | `docs/pwa.md`, dokumen fitur terkait, `docs/security-checklist.md` jika caching berubah                        |
| Teks UI, i18n, kamus terjemahan                    | `src/i18n/`, `docs/frontend-guidelines.md`, `docs/features/*`                                                   |
| Reusable UI guideline                              | `docs/frontend-guidelines.md`                                                                                  |

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

- **Status Project**: **Production (Live)**. Utamakan stabilitas, proteksi data riil, dan backward compatibility.
- Package manager: npm.
- Build production PWA memakai `next build --webpack`.
- Project memakai `src/proxy.ts`, bukan `middleware.ts`.
- POST dan traffic `/api/*` harus tetap NetworkOnly di service worker.
- Secret Gemini harus tetap di server-only env `AI_API_KEY`.
- Teks UI user-facing WAJIB bilingual dan dikelola melalui kamus `src/i18n/` (`id.ts` dan `en.ts`). Dilarang hardcode teks tampilan bahasa tertentu secara langsung di komponen UI atau Server Actions. Default bahasa adalah `'id'`.
- Jangan mengklaim Google OAuth, reset password email, recurring transaction, atau UI create/edit budget tersedia sebelum flow tersebut benar-benar ada di kode.

## Internationalization (i18n) Ground Rules (GR-10 s/d GR-17)

CatatZ mendukung bilingual (Bahasa Indonesia dan English) dengan arsitektur i18n berbasis kamus TypeScript tanpa library eksternal. Detail lengkap mengacu pada `docs/route-migration-plan.md` dan implementation plan i18n:

| Rule | Deskripsi |
| --- | --- |
| **GR-10 (No External i18n Library)** | Tidak memakai `next-intl`, `react-intl`, atau `i18next`. Gunakan dictionary file TypeScript (`src/i18n/`) dengan typed keys — cocok untuk Server Components tanpa dependency baru. |
| **GR-11 (Dictionary Structure)** | Satu file per locale (`id.ts`, `en.ts`) dengan objek nested yang identik. Key bersifat hierarchical: `page.section.element`. Semua keys di-type oleh satu shared `Dictionary` type di `src/i18n/types.ts`. |
| **GR-12 (No Locale Routing)** | Tidak ada path prefix `/en/` atau `/id/`. Locale disimpan sebagai user preference di database (`user_preferences.language`). Default `'id'` untuk backward compatibility user existing. |
| **GR-13 (Server-First Translation)** | Server Components dan Server Actions resolve locale dari database via `getLocale()`. Client Components menerima dictionary via React Context (`DictionaryProvider` / `useTranslation()`). |
| **GR-14 (Financial Terms Consistency)** | Istilah keuangan universal (nama bank, "QRIS") tidak diterjemahkan. Domain terms: `pemasukan`→`income`, `pengeluaran`→`expense`, `hutang`→`debt`, `piutang`→`receivable`, `cicilan`→`installment`, `saldo`→`balance`, `rekening`→`wallet`. |
| **GR-15 (Immutable DB Schema Names)** | Nama tabel, kolom, enum value (`transaksi`, `rekening`, `hutang`, `kategori`, `tipe_transaksi`, dll.) **TIDAK BOLEH diubah**. Hanya display text yang dilokalisasi. |
| **GR-16 (Additive Migration Only)** | Perubahan database (kolom `language` di `user_preferences`) menggunakan migration additive (`017-user-preferences-language.sql`). Kolom lama tidak diubah/dihapus. |
| **GR-17 (Phase Atomicity)** | Setiap perubahan menghasilkan aplikasi yang **fully functional** dan bebas regresi visual atau fungsional. |

## Quality and Safety

- Repository ini berstatus **Production**. Utamakan stabilitas, proteksi data riil, dan backward compatibility.
- Jangan expose secret, token, service role key, atau credential.
- Jangan revert perubahan user yang tidak terkait.
- Jangan menjalankan command destruktif tanpa instruksi eksplisit.
- **Untuk perubahan UI: wajib ikuti Design Contract. UI harus responsif, tidak overlap, tidak ada teks truncate di mobile, dan mengikuti DESIGN.md.**
- Untuk perubahan transaksi/import/database, ingat bahwa write ke `transaksi` dapat berdampak pada saldo rekening.

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->
