# GitHub Workflows & Repository Config

Dokumentasi workflow GitHub Actions dan konfigurasi repository `.github/` yang digunakan di project CatatZ.

## Struktur `.github/`

```
.github/
├── workflows/
│   ├── quality.yml
│   ├── dependency-review.yml
│   ├── codeql.yml
│   └── release.yml
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   └── feature_request.md
└── release.yml
```

---

## Workflows

### `quality.yml` — CI Quality Check

Berjalan pada setiap **pull request** dan setiap **push ke branch `main` atau `development`**.

| Job | Langkah |
|-----|---------|
| `quality` | `npm ci` → lint → typecheck → test:coverage → build |
| `e2e` | `npm ci` → install Playwright → test:e2e → upload report artifact |

Jika salah satu job gagal, merge ke branch utama diblokir.

---

### `dependency-review.yml` — Dependency Vulnerability Scan

Berjalan pada setiap **pull request**.

Menggunakan `actions/dependency-review-action` untuk memindai dependensi baru atau yang diperbarui. Jika ditemukan vulnerability dengan severity **high** atau di atasnya, PR akan diblokir dan ringkasan ditulis sebagai komentar di PR.

**Kapan ini membantu**: Saat ada PR yang menambah, menghapus, atau mengupdate package di `package.json`/`package-lock.json`.

---

### `codeql.yml` — Static Security Analysis

Berjalan pada:
- Setiap **push ke `main` atau `development`**
- Setiap **pull request ke `main` atau `development`**
- **Jadwal otomatis**: setiap Senin jam 01:30 UTC (cron `30 1 * * 1`)

Menggunakan **CodeQL** dari GitHub dengan query set `security-extended` untuk mendeteksi potensi celah keamanan di kode TypeScript/JavaScript. Hasil scan muncul di tab **Security → Code scanning** di halaman repository.

---

### `release.yml` — Automated Release

Berjalan saat **push tag** dengan format `v*.*.*` (mis. `v1.0.0`, `v1.2.3`).

Langkah yang dijalankan:
1. Checkout kode dengan full history (`fetch-depth: 0`)
2. Setup Node.js 24 + cache npm
3. `npm ci`
4. `npm run build`
5. Membuat GitHub Release otomatis dengan release notes yang di-generate dari PR yang sudah di-merge

**Cara membuat release baru:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Konfigurasi Release Notes

File `.github/release.yml` (bukan di dalam `workflows/`) mengatur bagaimana GitHub mengelompokkan PR ke dalam kategori changelog otomatis berdasarkan **label PR**.

| Kategori | Label PR yang Dipetakan |
|----------|------------------------|
| ✨ New Features | `enhancement`, `feature` |
| 🐛 Bug Fixes | `bug`, `fix` |
| 📖 Documentation | `docs`, `documentation` |
| 🔧 Tooling & CI | `ci`, `chore`, `tooling` |
| 🔒 Security | `security` |

PR berlabel `skip-changelog` tidak akan muncul di release notes.

**Praktik terbaik**: Pastikan setiap PR diberi label yang sesuai sebelum di-merge agar changelog release terbentuk otomatis dan rapi.

---

## Issue Templates

Tersedia di `.github/ISSUE_TEMPLATE/`:

### `bug_report.md`
Template untuk melaporkan bug. Berisi bagian:
- Deskripsi bug
- Langkah reproduksi
- Perilaku yang diharapkan vs aktual
- Screenshot/video
- Environment (OS, browser, versi app)

### `feature_request.md`
Template untuk mengusulkan fitur baru. Berisi bagian:
- Deskripsi fitur
- Masalah yang ingin diselesaikan
- Solusi yang diusulkan
- Alternatif yang dipertimbangkan
- Mockup/referensi

Saat pengguna membuka issue baru di GitHub, mereka akan disajikan pilihan antara kedua template ini.

---

## Label PR yang Direkomendasikan

Untuk memastikan release notes dan dependency review berjalan optimal, gunakan label berikut secara konsisten di setiap PR:

| Label | Digunakan Untuk |
|-------|----------------|
| `enhancement` / `feature` | Fitur baru |
| `bug` / `fix` | Perbaikan bug |
| `docs` / `documentation` | Perubahan dokumentasi |
| `ci` / `chore` / `tooling` | Perubahan tooling, CI, config |
| `security` | Perbaikan keamanan |
| `skip-changelog` | PR yang tidak perlu masuk changelog (mis. typo minor) |
