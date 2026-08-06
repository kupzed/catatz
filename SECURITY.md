# Security Policy - CatatZ

CatatZ is committed to ensuring the security of user financial data and privacy. This document outlines our security policy, vulnerability reporting procedures, and the data protection architecture implemented within this repository.

---

## 1. Supported Versions

Only the latest main version of CatatZ receives security updates and bug fixes.

| Version               | Supported          | Notes                                                               |
| --------------------- | ------------------ | ------------------------------------------------------------------- |
| `1.0.x` (main branch) | :white_check_mark: | Active production version based on Next.js 16 App Router & Supabase |
| `< 1.0.0`             | :x:                | Experimental / unsupported versions                                 |

---

## 2. Reporting a Vulnerability

If you discover a potential security vulnerability in CatatZ, **please do not report it through public GitHub Issues**.

### Reporting Channel

Please submit vulnerability reports privately to:

- **Email**: `catatz.app@gmail.com`
- **GitHub Private Vulnerability Reporting**: If enabled on this repository.

### Information to Include

To help us triage and resolve the issue quickly, please include:

1. A brief description of the vulnerability type (e.g., RLS bypass, session hijacking, XSS, CSRF).
2. Steps to reproduce the issue (Proof of Concept / PoC).
3. Affected module(s) or file(s) (e.g., Server Actions, PostgreSQL functions, `src/proxy.ts`, etc.).
4. Potential impact on user data.

### Response & Handling SLA

- **Acknowledgement**: Within **24–48 hours** of receipt.
- **Triage & Impact Assessment**: Within **3–5 business days**.
- **Patch & Fix**: Within **14 business days**, depending on severity.
- **Public Disclosure**: Disclosure will occur only after a fix has been deployed and verified.

---

## 3. Security Architecture & Data Protection

CatatZ applies a _Defense-in-Depth_ strategy across all application layers:

### A. Authentication & Session Management

- **Supabase SSR Auth**: Utilizes secure HTTP-only cookies with `SameSite=Lax` attributes to prevent token theft via XSS.
- **Middleware Proxy (`src/proxy.ts`)**: Validates and refreshes Supabase sessions on every authenticated request before rendering Server Components.
- **OAuth & Linking Protection**: Google OAuth & Manual Identity Linking verify matching primary email addresses before allowing account linking.

### B. Database Access Control (PostgreSQL RLS)

- **Row Level Security (RLS)**: Enforced on all user-owned tables (`transaksi`, `rekening`, `kategori`, `hutang`, `hutang_cicilan`, `anggaran`, `user_preferences`).
- **User Data Isolation**: Every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` query is strictly restricted at the database level using `auth.uid() = user_id`.
- **`SECURITY INVOKER` Functions**: Triggers and stored procedures (such as automatic balance updates and debt settlements) execute under the logged-in user's permissions (`SECURITY INVOKER`), preventing privilege escalation.

### C. AI Processing & Document Privacy (Transaction Auto Fill)

- **Ephemeral Execution**: Uploaded transaction receipts for Auto Fill are processed temporarily in-memory within Server Actions and transmitted directly to the Gemini API via `AI_API_KEY`.
- **Zero Data Retention**: Receipt images are **never stored** in Supabase Storage, database tables, disk caches, or production logs.
- **Strict File Validation**: Validates MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) and enforces file size limits (max 4.5 MB).

### D. Storage Object Security

- **Public Bucket `avatars`**: Restricted strictly to public user avatar images.
- **Path-Isolated Storage RLS**: Storage RLS policies restrict `UPDATE` and `DELETE` permissions exclusively to subfolders matching the user's ID (`auth.uid()`).
- **No Private Documents**: Private financial documents or transaction records are strictly prohibited from public storage buckets.

### E. PWA & Offline Caching Security

- **NetworkOnly Strategy**: All HTTP `POST` requests and sensitive routes under `/api/*` are configured with `NetworkOnly` in the Service Worker (`serwist.config.ts`), preventing offline caching of sensitive mutations or authentication state.
- **Isolated Precache**: PWA cache only stores static UI assets (`.html`, `.js`, `.css`, `manifest.json`) and the `offline.html` fallback page.

### F. Security Headers & Network Safety

Configured HTTP Security Headers in `next.config.ts`:

- `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing.
- `X-Frame-Options: DENY` & `Content-Security-Policy: frame-ancestors 'none'` — Protects against Clickjacking attacks.
- `Referrer-Policy: strict-origin-when-cross-origin` — Controls referrer information leakage.
- `Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=(), usb=()` — Disables unused browser hardware capabilities.
- `poweredByHeader: false` — Removes the `X-Powered-By: Next.js` header.

### G. Secret Management

- Sensitive keys such as `AI_API_KEY` and Supabase Service Role Keys **remain server-side only** and must never be exposed via `NEXT_PUBLIC_` prefixes.
- Configuration files `.env` and `.env.local` are explicitly ignored in `.gitignore` and never committed to source control.

---

## 4. Developer & Self-Hosting Best Practices

For developers contributing to or self-hosting CatatZ:

1. **Run Automated Verification**:
   - `npm run verify:quick` for ESLint, TypeScript typechecks, and Vitest unit tests.
   - `npm run verify` for full verification including Playwright E2E tests and production PWA builds.
2. **Immutability of Database Migrations**:
   - Migration files in `src/migrations/` are immutable. Always create a new `.sql` migration file for schema or RLS changes.
3. **Audit New RLS Policies**:
   - Any new table MUST include `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` along with `WITH CHECK` and `USING` policies bound to `auth.uid()`.

---

_Last updated: August 2026._
