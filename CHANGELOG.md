## 🎉 CatatZ v1.0.0 — First Public Release

CatatZ is a personal finance tracking web app (PWA) built on Next.js 16, Supabase, and Tailwind CSS v4. This is the first public release, shipping a complete set of core features for day-to-day personal finance management.

---

### ✨ Core Features

#### 💰 Transaction Management
- Record **Income**, **Expense**, **Transfer** between accounts, and **Balance Correction** transactions
- Fields: title, amount, category, account, date & time, and notes
- **AI Voice Input** — speak your transaction using the browser's Speech Recognition API; Gemini AI parses and fills the form automatically
- **AI File Auto-fill** — upload a receipt or invoice, and AI extracts the transaction details into the form
- Smart amount input with accurate thousands/decimal separator masking
- Filter, search, and date-based navigation

#### 🏦 Account Management
- Create accounts with a custom name, logo, color, and opening balance
- Option to exclude specific accounts from the total balance
- Referential protection: accounts cannot be deleted while linked transactions exist

#### 🗂️ Categories
- Built-in system categories
- Custom user-defined categories per account
- Deletion protection: categories in use by transactions cannot be removed

#### 📊 Financial Summary (Rekap)
- Monthly overview: total income, expenses, and net balance
- Per-category breakdown with interactive charts (Recharts)
- Drill-down into individual transactions within the selected month

#### 🤝 Debt & Receivables (Hutang/Piutang)
- Track debts and receivables with borrower/lender details
- Installment system with automatic remaining balance and settlement status
- PostgreSQL trigger ensures installment balance consistency

#### 📤 Report Export
- Export to **PDF** (jsPDF + autotable)
- Export to **XLSX** (ExcelJS)
- Export to **CSV**

---

### 🔐 Authentication & Security

- Email + password login and registration
- **Google OAuth** — sign in or link a Google account from settings
- **Forgot password** and **reset password** via email
- **Active session management** — view and revoke sessions from other devices
- **Delete account** with full data removal confirmation
- Row Level Security (RLS) enforced on all Supabase tables

---

### ⚙️ Settings & Preferences

- Update display name and profile avatar (uploaded to Supabase Storage)
- Change password with current password verification
- **Format preferences**: date format, number format (dot/comma separator), timezone
- **Theme preferences**: Light, Dark, or System
- **Dynamic landing page**: choose the default page shown after login
- All preferences are stored in the database and synced across devices

---

### 📱 Progressive Web App (PWA)

- **Install prompt** for add-to-home-screen on iOS and Android
- **Offline shell**: app navigation remains functional without a connection
- **Update prompt**: notification when a new version is available
- **Offline queue**: transaction actions queued while offline are automatically retried on reconnect
- Service worker powered by [Serwist](https://serwist.pages.dev/)

---

### 🎨 Design System

- Institutional design system inspired by **Coinbase brand guidelines**
- Consistent color tokens, shape rules, typography scale, and elevation
- Full **Light mode** and **Dark mode** support
- Typefaces: **Inter** (UI text) · **Geist Mono** (financial figures)
- Fully responsive: mobile `< 640px` and desktop `> 1024px`

---

### 🗄️ Database & Infrastructure

- **13 structured database migrations** (001–013)
- Schema covers: profiles, accounts, categories, transactions, debts, budgets, recurring, avatar storage, user preferences, and user sessions
- PostgreSQL triggers for automatic debt balance recalculation
- Production deployment via **Vercel** (webpack build for Serwist service worker compatibility)

---

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Runtime | React 19, TypeScript |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (Email + Google OAuth) |
| Storage | Supabase Storage |
| Styling | Tailwind CSS v4, shadcn/ui |
| Forms | React Hook Form + Zod |
| State | TanStack Query v5, Zustand |
| Charts | Recharts |
| PWA | Serwist |
| AI | Google Gemini API |
| Deployment | Vercel |
| Testing | Vitest, Playwright |

---

### 📋 Notes

- **Budget** schema is in place, but the create/edit budget UI is not yet available in this release
- **Recurring transactions** schema is ready but not yet exposed in the UI
- Self-hosting requires your own Supabase instance — see [`.env.example`](./.env.example) for required environment variables

---

### 🔗 Links

- [README](./README.md)
- [Technical Documentation](./docs/README.md)
- [Environment Variables](./docs/environment-variables.md)
- [Local Setup Guide](./docs/setup-local.md)
