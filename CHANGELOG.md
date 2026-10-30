## Unreleased

Introducing **Full Bilingual Support (Indonesian & English / i18n)** across all user-facing flows:

- **Zero-Dependency TypeScript i18n Architecture (`src/i18n/`):**
  - Fully-typed dictionary pattern (`id.ts`, `en.ts`) adhering to a strict recursive `Dictionary` interface.
  - Server-first locale resolution via `getLocale()` from `user_preferences.language` (defaulting to `'id'`).
  - React Context `DictionaryProvider` and `useTranslation()` client hook for seamless client component translation without content flash.
  - Dynamic root layout `<html lang={locale}>` and localized HTML metadata (title, description, keywords).
- **Zod Validation Schema Factory Pattern:**
  - Migrated form validation schemas to factory functions (`get<Entity>Schema(dict)`) ensuring real-time bilingual validation error messages.
- **Database Language Preference (`017-user-preferences-language.sql`):**
  - Additive migration introducing `language TEXT NOT NULL DEFAULT 'id'` with check constraint on `user_preferences`.
- **System Preference Language Switcher (`/settings`):**
  - Instant language toggling with optimistic client feedback and server boundary refresh.
- **PWA Localization:**
  - Localized offline fallback page (`offline.html`), offline indicator, and app manifest metadata.

---

## v1.3.0

The fourth release of CatatZ, introducing **User-Owned Categories & Category Detail Workspaces**, a **comprehensive Debt & Loan System Overhaul with Entity Contacts**, **Wallet Detail Workspaces with Transfer Direction Switcher**, **Server-Side Transaction Pagination bypassing PostgREST limits**, **Transaction Detail Drawer with Copy Actions**, **modernized engine dependencies (Next.js 16.4, React 19.3, Vitest 5)**, and an expanded test suite of **293 unit tests (97.2% coverage)**.

This release includes 48 commits (26 non-merge) touching 96 files and merging 22 Pull Requests (#17 to #39) since v1.2.0.

---

### ✨ Highlights & New Features

#### 🏷️ User-Owned Categories & Category Workspace (`/categories` & `/categories/[id]`) ([#30](https://github.com/kupzed/catatz/pull/30), [#34](https://github.com/kupzed/catatz/pull/34), [#37](https://github.com/kupzed/catatz/pull/37))

- **User-Owned Categories Migration (`016-user-owned-categories.sql`):**
  - Migrated legacy system-wide categories to fully independent, user-owned categories with strict Row Level Security (RLS).
  - Automatically cloned and re-mapped existing transactions, budgets, and recurring rules to each user's cloned categories without data loss.
  - Updated `handle_new_user()` database trigger to automatically seed 6 default categories for every newly registered user.
- **Dedicated Category Detail Workspace (`/categories/[id]`):**
  - Category metadata view (name, emoji icon, color token, transaction type badge).
  - Real-time financial insights: Total Transactions, Total Spent/Received, Average Amount per Transaction, and expense proportions.
  - Filterable transaction history with date range selection and pagination.
  - Adding transactions directly inside category detail automatically locks the category and constrains selectable transaction types (e.g. expense-only categories restrict selection to expenses).

#### 🤝 Debt & Loan System Overhaul (`/debts` & `/debts/[id]`) ([#26](https://github.com/kupzed/catatz/pull/26), [#27](https://github.com/kupzed/catatz/pull/27))

- **Database & Trigger Overhaul (`015-hutang-piutang-revamp.sql`):**
  - Shifted model from static loans to dynamic Financial Contact Entities.
  - Added `jenis_transaksi` (`pembayaran` | `pinjaman`) to installment records to support multi-disbursement loans (adding new loan amounts to existing contacts).
  - Flexible repayment engine supporting overpayments without corrupting wallet balances.
  - Added `is_lunas_manual` flag to manually close loans independently.
  - Rewrote `update_sisa_hutang()` trigger for dynamic, real-time balance calculations.
- **Dedicated Contact Workspace (`/debts/[id]`):**
  - Contact detail page displaying total borrowed/lent, total paid, remaining balance, and full installment/disbursement timelines.
  - Unified modal actions: Record Payment, Add New Loan, Mark as Settled, and Delete Contact.
  - Net Worth overview cards on `/debts` index (Total Receivables, Total Payables, Net Balance).

#### 🏦 Wallet Detail Workspace & Direction Switcher (`/wallets/[id]`) ([#28](https://github.com/kupzed/catatz/pull/28), [#38](https://github.com/kupzed/catatz/pull/38))

- **Dedicated Wallet Workspace:**
  - Real-time wallet overview showing live balance, total income, total expense, net flow, and percentage share of total liquid wealth.
  - Integrated transaction history with date range filtering, transaction type tabs, and pagination.
- **Locked Wallet Context & Transfer Switcher:**
  - Opening the transaction dialog from inside a wallet locks that wallet as either the sender or receiver.
  - One-click transfer direction switcher ("Send from" ⇄ "Receive to") directly in the transfer modal.
- **PostgREST 1,000-Row Limit Protection:**
  - Paged account usage count queries in `rekening-action.ts` to prevent silent data truncation on large transaction datasets.

#### 📝 Transactions Revamp & Detail Drawer (`/transactions`) ([#17](https://github.com/kupzed/catatz/pull/17), [#19](https://github.com/kupzed/catatz/pull/19), [#21](https://github.com/kupzed/catatz/pull/21), [#23](https://github.com/kupzed/catatz/pull/23))

- **Server-Side Pagination:**
  - Full offset/cursor pagination replacing client-side row capping, seamlessly handling tens of thousands of transactions.
- **Transaction Detail Drawer Sheet (`TransaksiDetailSheet`):**
  - Clicking any transaction item opens an accessible slide-over sheet (drawer on mobile, modal on desktop) showing comprehensive details (UUID, timestamps, wallet, category, notes, attachments).
  - Quick action to copy formatted transaction details to clipboard.
  - Direct shortcuts to Edit or Delete.
- **Transfer Mutual Protection & Auto-Switch:**
  - Prevents selecting identical source and destination wallets in transfer dialogs by automatically switching the other account.
- **Compact Toolbar & Fullscreen Mobile Filter:**
  - Single-row responsive filter toolbar with active filter badges and dismissals.
  - Mobile fullscreen slide-up filter sheet with clean 2x2 tab navigation.

---

### ⚙️ Platform & Engine Modernization

- **Next.js & React Upgrade:**
  - `next`: `16.2.6` ➔ `16.4.2`
  - `react` & `react-dom`: `19.2.4` ➔ `19.3.1`
  - `eslint-config-next`: `16.2.6` ➔ `16.4.2`
- **Testing Engine:**
  - `vitest` & `@vitest/coverage-v8`: `4.1.8` ➔ `5.0.5`
  - `@testing-library/jest-dom`: `6.9.1` ➔ `7.0.1`
  - `jsdom`: `29.1.1` ➔ `30.1.3`
- **PWA Serwist:**
  - `@serwist/next` & `serwist`: `9.5.11` ➔ `9.5.13` (recompiled `public/sw.js`).
- **Core Dependencies:**
  - Updated `@supabase/supabase-js` (`2.118.0`), `@supabase/ssr` (`0.12.7`), `@google/genai` (`2.30.0`), `@tanstack/react-query` (`5.104.5`), `lucide-react` (`1.61.0`), `recharts` (`3.10.1`), `zod` (`4.6.7`), `zustand` (`5.0.15`), `tailwind-merge` (`3.7.0`), `sharp` (`0.35.5`).
- **Code Intelligence:**
  - Configured local code intelligence graph with CodeGraph integration (`.codegraph/`).

---

### 🗄️ Database Migrations

- **`015-hutang-piutang-revamp.sql`**: Relaxes loan constraints, adds `jenis_transaksi` to installments, introduces `is_lunas_manual`, and upgrades triggers for multi-disbursements and overpayments.
- **`016-user-owned-categories.sql`**: Migrates system categories to user-owned categories, updates RLS policies, re-links existing user transactions/budgets/recurring rules, and configures auto-seeding for new registrations.

---

### 🧪 Tests & Quality Metrics

- **Unit Test Expansion:** Expanded from 190 tests (15 test files) to **293 tests across 28 test files** (100% passing).
- **Code Coverage:** **97.2% line coverage** and **100% function coverage** across all core business logic engines.
- **Full Verification Gate:** Clean pass on `npm run verify` (ESLint 9, TypeScript typecheck, Vitest 5 with coverage, and production Webpack build).

---

### 📊 Release Stats

| Metric               | Value               |
| -------------------- | ------------------- |
| Commits since v1.2.0 | 48 (26 non-merge)   |
| Files changed        | 96                  |
| Lines added          | 10,903              |
| Lines removed        | 1,685               |
| Pull Requests merged | #17 to #39 (22 PRs) |
| Unit Tests Passing   | 293 / 293 (100%)    |
| Test Line Coverage   | 97.2%               |

---

### 🔗 Links

- [Full Changelog](https://github.com/kupzed/catatz/compare/v1.2.0...v1.3.0)
- [README](./README.md)
- [Technical Documentation](./docs/README.md)
- [Database Migrations](./docs/database-migrations.md)
