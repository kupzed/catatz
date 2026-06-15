# ECC Development Workflow

## Tujuan

CatatZ memakai subset Everything Claude Code (ECC) untuk menstandarkan planning, TDD, review, debugging, dokumentasi, dan verifikasi. Integrasi ini hanya memengaruhi tooling development. Runtime aplikasi, schema database, RLS, dan deployment tidak bergantung pada ECC.

## Struktur

- `.agents/skills`: canonical skills untuk Codex dan harness yang membaca Agent Skills.
- `.claude/skills`: wrapper Claude Code yang menunjuk ke canonical skills.
- `.codex/agents` dan `.claude/agents`: planner, code reviewer, security reviewer, dan docs researcher dalam mode read-only.
- `.ecc/hooks`: shared policy, metadata memory, dan quick verification.
- `.codex/hooks.json` dan `.claude/settings.json`: adapter lifecycle masing-masing harness.
- `.ecc/manifest.json`: sumber ECC, commit, checksum skill, kebijakan runtime, dan MCP yang diizinkan.
- `.ecc/runtime`: metadata sesi lokal yang diabaikan Git.

## Workflow Harian

1. Untuk fitur atau refactor kompleks, gunakan `planner` dan tetapkan test serta dokumentasi yang terdampak.
2. Ikuti RED -> GREEN -> REFACTOR menggunakan `npm run test:watch` atau test target yang relevan.
3. Gunakan main agent untuk semua edit. Specialized agents hanya membaca dan memberi analisis.
4. Jalankan code review setelah perubahan. Jalankan security review untuk auth, RLS, Server Actions, input, upload, Gemini, secret, atau data finansial.
5. Jalankan `npm run verify:quick` selama iterasi dan `npm run verify` sebelum PR jika Playwright browser tersedia.

## Testing

| Command | Fungsi |
|---|---|
| `npm run typecheck` | TypeScript tanpa emit |
| `npm run test` | Unit test Vitest satu kali |
| `npm run test:watch` | Unit test dalam watch mode |
| `npm run test:coverage` | Coverage V8 untuk modul yang sudah masuk baseline |
| `npm run test:e2e` | Playwright Chromium dengan mock Supabase lokal terautentikasi |
| `npm run verify:quick` | Lint, typecheck, dan unit test |
| `npm run verify` | Quick verification, coverage, E2E, dan production build |

Vitest dipakai untuk helper, validation, state, dan komponen sinkron. Playwright dipakai untuk async Server Components dan alur browser. Test E2E menjalankan aplikasi pada port `3100` dengan output Next.js terisolasi di `.next-e2e`, memakai fixture Supabase lokal terautentikasi, dan tidak menghubungi Supabase atau Gemini production. Target 80% diterapkan pada kode baru/diubah dan modul pure yang secara eksplisit masuk konfigurasi coverage.

## Hooks dan Privacy

Pre-tool policy memblokir destructive Git, recursive deletion di luar generated directories, perubahan `.env`, credential inline, linked Supabase mutation, dan destructive SQL. Guardrail hook tidak menggantikan approval harness atau review manusia.

Post-tool hook memindai file berubah secara lokal untuk kemungkinan hardcoded secret dan `console.log`. Isi file hanya dibaca saat scan dan tidak disimpan.

Memory hanya menyimpan:

- identifier sesi yang sudah di-hash;
- harness dan timestamp;
- path file berubah;
- status `npm run verify:quick`;
- fingerprint metadata perubahan.

Prompt, tool arguments, transcript, isi file, secret, dan payload finansial tidak disimpan. Retensi maksimum adalah 100 sesi atau 30 hari.

## MCP dan Database

Connector project yang diizinkan hanya `chrome-devtools-mcp@1.2.0`. GitHub tetap menggunakan `gh`. Supabase menggunakan SDK/CLI dan skills yang tersedia. Jangan menambahkan Supabase MCP atau menghubungkan test ke project production.

## Aktivasi Harness

- Codex memuat `.codex/config.toml` dan `.codex/hooks.json` setelah repository dipercaya. Tinjau dan trust hook project melalui `/hooks` sebelum penggunaan pertama.
- Claude Code memuat `.claude/settings.json`. Verifikasi hook yang aktif melalui `/hooks`.
- `CLAUDE.md` tetap mendelegasikan instruksi utama ke `AGENTS.md`.

## Update dan Rollback

Saat memperbarui skill ECC, gunakan commit/tag eksplisit, salin hanya skill yang tercatat di manifest, hitung ulang SHA-256, dan update `skills-lock.json`. Jangan memakai installer `full` di repository ini.

Untuk menonaktifkan ECC tanpa memengaruhi aplikasi, hapus atau pindahkan `.codex`, `.claude`, `.agents` skills ECC, `.ecc`, dan `.mcp.json`, lalu hapus dependency serta scripts testing hanya jika fondasi test juga memang ingin dibuang. Tidak diperlukan rollback database atau deployment.

## Referensi

- [Codex project configuration](https://developers.openai.com/codex/config-basic)
- [Codex hooks](https://developers.openai.com/codex/hooks)
- [Codex subagents](https://developers.openai.com/codex/subagents)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)
- [Next.js testing guide](https://nextjs.org/docs/app/guides/testing)
