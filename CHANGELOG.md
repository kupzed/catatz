## v1.1.0

The second feature release of CatatZ, focused on **improved transaction filter UX**, **more intuitive input fields**, and **security hardening** from CodeQL audit findings.

This release includes 15 commits since v1.0.1, touching 26 files.

---

### ✨ New Features

#### 🔍 Multi-Select Combo Filters ([#8](https://github.com/kupzed/catatz/pull/8))

- **Tipe**, **Rekening**, and **Kategori** filters on the transaction page now support **multi-select** using DropdownMenu + CheckboxItem
- Added new **Kategori** multi-select filter that was previously unavailable
- Sort filter (newest/oldest/largest/smallest) remains single-select
- Backend `getTransaksi` server action updated to support array-based filtering via Supabase `.in()` query
- Filter trigger height corrected from `h-11` to `h-12` per DESIGN.md specification

#### ✕ Clearable Input Fields ([#7](https://github.com/kupzed/catatz/pull/7))

- New reusable `ClearableInput` component — wraps the base `Input` with an end-positioned X button to clear the value
- Clear button added to `NominalInput` for all financial amount fields
- Applied across all dashboard dialogs: transactions, accounts, categories, debts, search filters, installments, and profile settings
- Date/time and auth inputs are intentionally excluded

---

### 🐛 Bug Fixes

- **fix(ui):** Fix double-click required to clear nominal and text inputs — added `onMouseDown preventDefault` to prevent blur event race condition that restored the formatted value before the clear action could execute ([9aeedd3](https://github.com/kupzed/catatz/commit/9aeedd3))
- **fix(warning):** Fix word wrapping in voice transcript display on smaller screens ([7e04a4c](https://github.com/kupzed/catatz/commit/7e04a4c))

---

### 🔐 Security

- **fix(security):** Add `event.source` guard to service worker message handler to prevent untrusted windows from triggering `skipWaiting()` (CWE-20, CWE-940) ([e44a3ee](https://github.com/kupzed/catatz/commit/e44a3ee))
- **fix(security):** Sanitize URL protocol for avatar `src` attribute — only allow `https:`, `blob:`, and `data:` protocols to prevent potential XSS (CWE-79, CWE-116) ([e44a3ee](https://github.com/kupzed/catatz/commit/e44a3ee))
- **fix(security):** Move `sanitizeAvatarUrl` to module-level function so CodeQL recognises it as a sanitisation barrier; sanitize at every state entry point ([c6a3d9e](https://github.com/kupzed/catatz/commit/c6a3d9e))
- **docs(security):** Add [SECURITY.md](./SECURITY.md) with vulnerability reporting policy and CatatZ security architecture documentation ([1cb0682](https://github.com/kupzed/catatz/commit/1cb0682))

---

### 📝 Documentation & Maintenance

- Add License (MIT) section to README ([666d9ef](https://github.com/kupzed/catatz/commit/666d9ef))
- Fix table formatting and references in AGENTS.md ([ad874d2](https://github.com/kupzed/catatz/commit/ad874d2))
- Update `docs/features/transaksi.md` and `docs/server-actions-api.md` to reflect filter changes
- Add `continue-on-error` to dependency-review workflow for repos without Dependency Graph enabled

---

### 🧪 Tests

- Update E2E test assertion: account filter trigger `#filter-rekening` height from 44px to 48px to align with DESIGN.md `h-12` specification ([9655663](https://github.com/kupzed/catatz/commit/9655663))

---

### 📊 Stats

| Metric               | Value             |
| -------------------- | ----------------- |
| Commits since v1.0.1 | 15 (10 non-merge) |
| Files changed        | 26                |
| Lines added          | 637               |
| Lines removed        | 141               |
| Pull Requests merged | #3, #6, #7, #8    |

---

### 🔗 Links

- [Full Changelog](https://github.com/kupzed/catatz/compare/v1.0.1...v1.1.0)
- [README](./README.md)
- [Security Policy](./SECURITY.md)
- [Technical Documentation](./docs/README.md)
