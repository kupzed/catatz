# Changelog

Format mengikuti Keep a Changelog sederhana.

## Unreleased

### Added

- Initial project documentation.
- Documentation index in `docs/README.md`.
- Project overview documentation.
- Architecture documentation.
- Folder structure documentation.
- Local setup documentation.
- Environment variables documentation.
- Database schema documentation.
- Database migrations documentation.
- Supabase Auth documentation.
- RLS policies documentation.
- Server Actions and API documentation.
- Frontend guidelines.
- Feature documentation for transaksi, rekening, kategori, hutang/piutang, laporan, settings, and auth.
- Vercel deployment checklist.
- PWA documentation.
- Security checklist.
- Troubleshooting guide.
- AI development rules.
- Repository-level Codex workflow instructions in `AGENTS.md`.
- Conventional Commit guidance for Codex task summaries.
- Technical commit message body requirements for Codex final responses.
- Documentation references for the Codex operating instructions.
- Root `.env.example`.
- `DESIGN.md` — Coinbase institutional design system reference (colors, typography, components, spacing).

### Changed

- Full UI redesign mengikuti `DESIGN.md` (Coinbase institutional style):
  - Design tokens (CSS variables) di `globals.css`: Coinbase Blue primary, surface tiers, semantic colors, Inter font, Geist Mono.
  - UI primitives (`button`, `input`, `select`, `card`, `badge`, `dialog`): pill CTA, rounded-card container, rounded-input form, flat shadow.
  - Navigation: sidebar institutional style, active state left-border, brand blue hemat.
  - Dashboard pages (transaksi, rekening, rekap, hutang, kategori, settings, auth): dark hero card, asset-row pattern, mono font pada nominal.
  - Auth pages: clean light canvas, card `rounded-[24px]`, pill CTA.
- `AGENTS.md` diperbarui dengan **Design Contract** — setiap perubahan UI wajib mengikuti `DESIGN.md`.
- `docs/frontend-guidelines.md` diperbarui secara komprehensif dengan token warna, typography hierarchy, shape rules, pola komponen, dan checklist review UI.
