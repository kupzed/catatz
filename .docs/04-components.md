# Komponen & Halaman

## Route Map

| URL | File | Keterangan |
|---|---|---|
| `/` | `app/page.tsx` | Redirect ke `/transaksi` |
| `/login` | `app/(auth)/login/page.tsx` | Halaman login |
| `/register` | `app/(auth)/register/page.tsx` | Halaman daftar |
| `/transaksi` | `app/(dashboard)/transaksi/page.tsx` | Daftar transaksi |
| `/rekening` | `app/(dashboard)/rekening/page.tsx` | Daftar rekening |
| `/rekap` | `app/(dashboard)/rekap/page.tsx` | Analitik & grafik |
| `/hutang` | `app/(dashboard)/hutang/page.tsx` | Hutang & piutang |
| `/settings` | `app/(dashboard)/settings/page.tsx` | Pengaturan |

---

## Layout Hierarchy

```
app/layout.tsx               → Root: ThemeProvider, ReactQuery, Toaster
└─ app/(auth)/layout.tsx     → Glassmorphism dark background
└─ app/(dashboard)/layout.tsx → Sidebar + Header + Breadcrumb
   └─ page.tsx (server)      → Fetch data → pass ke Client Component
      └─ *-page-client.tsx   → Interaktivitas
```

---

## Komponen Shared

### `src/components/common/app-sidebar.tsx`
Sidebar navigasi utama. Props: user session dari server.

**Navigation items:**
- 💸 Transaksi → `/transaksi`
- 🏦 Rekening → `/rekening`
- 📊 Rekap → `/rekap`
- 🤝 Hutang → `/hutang`
- ⚙️ Settings → `/settings`

**Fitur:**
- Collapsible di mobile
- Highlight active route via `usePathname()`
- Avatar + nama user di bagian bawah
- Tombol Sign Out

---

## Modul Transaksi

### `transaksi/page.tsx` (Server Component)
Mengambil: `getTransaksi()`, `getRekening()`, `getKategori()` secara paralel via `Promise.all`.

### `_components/transaksi-page-client.tsx`
State lokal:
- `transaksi[]` — daftar transaksi (optimistic updates)
- `filter` — filter aktif (tipe, rekening, kategori)
- `search` — pencarian teks catatan
- `dialogOpen` — buka/tutup form dialog

Computed:
- `filtered` — transaksi yang sudah difilter (useMemo)
- `totalIncome`, `totalExpense` — summary card

### `_components/transaksi-dialog.tsx`
Form CRUD transaksi. Fitur:
- **AI Smart Input**: ketik natural language → Gemini parse otomatis
- **Auto-suggest kategori**: delay 800ms setelah ketik catatan, query histori
- Tab: Keluar / Masuk / Transfer
- Rekening Tujuan muncul hanya jika tipe = Transfer

---

## Modul Rekening

### `_components/rekening-page-client.tsx`
- Card total saldo (gradient indigo-violet)
- Grouped by jenis (Bank, E-Wallet, Tunai, Investasi)
- Toggle exclude dari total (Switch)
- Color accent per rekening (1px bar kiri)

### `_components/rekening-dialog.tsx`
Fitur khusus:
- **Bank Selector**: grid 3 kolom dengan color swatch per bank
- Tab: Bank / E-Wallet / Tunai / Investasi
- Pilih bank → auto-isi nama, warna, jenis
- Color picker: 10 preset + HTML color input

---

## Modul Rekap

### `_components/rekap-page-client.tsx`
Menggunakan Recharts:
- **Bar Chart**: Income vs Expense per bulan (12 bulan)
- **Pie Chart**: Breakdown expense by kategori bulan ini
- **Budget Progress**: bar per kategori dengan status warna
  - 🟢 < 70% = aman
  - 🟡 70–90% = waspada
  - 🔴 > 90% = bahaya

**Month navigation**: tombol `← →` ganti bulan, state dikontrol client.

---

## Modul Hutang

### `_components/hutang-page-client.tsx`
Dikelompokkan: **Piutang** (📤 Memberi Pinjaman) & **Hutang** (📥 Menerima Pinjaman).

Per kartu hutang:
- Progress bar terbayar (%)
- Status badge: ⏳ Aktif / ✅ Lunas / ⚠️ Overdue
- Expand → form input cicilan inline
- Tombol **WA Reminder** → buka WhatsApp dengan pesan otomatis
- Tombol **Tandai Lunas**

### `_components/hutang-dialog.tsx`
Form sederhana: tipe, nama entitas, total, tanggal mulai/tempo, catatan.

---

## Modul Settings

### `_components/settings-page-client.tsx`
Tabs:
1. **Profil** — tampilkan email, edit nama
2. **Tampilan** — Dark Mode toggle (via `next-themes`)
3. **Kategori** — lihat semua kategori sistem & kustom
4. **Export** — tombol Export CSV / Excel (placeholder)

---

## Komponen UI (shadcn/ui)

Semua ada di `src/components/ui/`. Yang digunakan:

| Komponen | Dipakai di |
|---|---|
| `Button` | Semua halaman |
| `Input` | Semua form |
| `Select` | Form transaksi, filter |
| `Dialog` | Semua modul (CRUD) |
| `Badge` | Tipe transaksi, status hutang |
| `Switch` | Rekening exclude, dark mode |
| `Tabs` | Transaksi tipe, rekening jenis, settings |
| `Progress` | Budget, hutang cicilan |
| `Breadcrumb` | Header dashboard |
| `Separator` | Settings sections |
| `Skeleton` | Loading state |
| `Tooltip` | Sidebar collapsed state |
| `Avatar` | User profile |
