# Feature: Transaksi

## Status

Status: **Production (Aktif)**.

## Deskripsi

Fitur transaksi digunakan untuk mencatat pemasukan, pengeluaran, transfer antar rekening, dan koreksi saldo.

## Route

- `/transactions`
- Shortcut PWA: `/transactions?new=true`

## Lokasi File

- Page: `src/app/(dashboard)/transactions/page.tsx`
- Loading: `src/app/(dashboard)/transactions/loading.tsx`
- Client page: `src/app/(dashboard)/transactions/_components/transaksi-page-client.tsx`
- Detail Content Presentational: `src/app/(dashboard)/transactions/_components/transaksi-detail-content.tsx`
- Detail Sheet Drawer: `src/app/(dashboard)/transactions/_components/transaksi-detail-sheet.tsx`
- Detail Helper: `src/lib/transaksi-detail.ts`
- Filter Bar: `src/app/(dashboard)/transactions/_components/transaksi-filter-bar.tsx`
- Filter Sheet: `src/app/(dashboard)/transactions/_components/transaksi-filter-sheet.tsx`
- List Container: `src/app/(dashboard)/transactions/_components/transaksi-list.tsx`
- List Item: `src/app/(dashboard)/transactions/_components/transaksi-list-item.tsx`
- Pagination: `src/app/(dashboard)/transactions/_components/transaksi-pagination.tsx`
- Dialog: `src/app/(dashboard)/transactions/_components/transaksi-dialog.tsx`
- Dialog Hook: `src/app/(dashboard)/transactions/_components/use-transaksi-dialog.ts`
- Dialog Header: `src/app/(dashboard)/transactions/_components/transaksi-dialog-header.tsx`
- Dialog AI Section: `src/app/(dashboard)/transactions/_components/transaksi-ai-section.tsx`
- Dialog Tipe Tabs: `src/app/(dashboard)/transactions/_components/transaksi-tipe-tabs.tsx`
- Dialog Form Fields: `src/app/(dashboard)/transactions/_components/transaksi-form-fields.tsx`
- Dialog Footer: `src/app/(dashboard)/transactions/_components/transaksi-dialog-footer.tsx`
- Voice button: `src/app/(dashboard)/transactions/_components/voice-input-button.tsx`
- File Auto Fill button: `src/app/(dashboard)/transactions/_components/transaction-file-auto-fill-button.tsx`
- Actions: `src/actions/transaksi-action.ts`
- File parsing action: `src/actions/transaction-file-action.ts`
- Validation: `src/validations/transaksi-validation.ts`
- Types: `src/types/transaksi.d.ts`
- AI parser types: `src/types/transaction-parser.d.ts`
- Offline queue: `src/lib/offline-queue.ts`

## Data Source

Initial data diambil di Server Component dengan:

- `getTransaksi()`
- `getRekening()`
- `getKategori()`

## Tabel Database Terkait

- `transaksi`
- `rekening`
- `kategori`

## Server Action Terkait

- `getTransaksi`
- `getTransaksiById`
- `getKategori`
- `createTransaksi`
- `updateTransaksi`
- `deleteTransaksi`
- `getJudulSuggestions`
- `getRecentJudul`
- `suggestKategori`
- `processVoiceInput` untuk input suara
- `processTransactionFile` untuk Auto Fill gambar/PDF

## Business Rules

- `nominal` wajib lebih dari 0.
- `income` dan `expense` wajib memiliki `judul` dan `kategori_id`.
- `transfer` wajib memiliki `rekening_tujuan`.
- `rekening_id` dan `rekening_tujuan` tidak boleh sama untuk transfer.
- `transfer` dan `correction` tidak boleh memiliki `judul` berdasarkan schema UI.
- Server Action create/update memvalidasi payload dengan `transaksiSchema` agar proteksi tidak hanya bergantung pada UI.
- Database juga memastikan `correction` tidak memiliki `judul`.
- Trigger database otomatis mengubah saldo rekening untuk `income`, `expense`, dan `transfer`.
- `correction` tidak diproses trigger dan ditangani manual oleh Server Action rekening/transaksi.
- Setelah create/update/delete, route `/transactions`, `/wallets`, dan `/reports` di-revalidate.

## UI Behavior

- Toolbar transaksi disusun dalam 1 baris terpadu baik di desktop maupun mobile dengan urutan: `[Filter]` - `[Search]` - `[Tambah Transaksi]`. Pada tampilan mobile, tombol tambah transaksi diringkas menjadi tombol ikon `+` (tanpa label teks) agar hemat ruang dan muat dalam satu baris.
- Menu filter diakses melalui tombol `Filter` yang menampilkan badge angka jumlah filter aktif. Mengklik tombol ini membuka panel Filter: pada mobile layar penuh muncul dari bawah ke atas (fullscreen slide-up drawer dengan safe-area padding), sedangkan pada desktop meluncur dari sisi kanan (side sheet).
- Formulir filter di dalam panel mencakup:
  - Tipe Transaksi menggunakan segmented control (Semua, Pengeluaran, Pemasukan, Transfer) dengan tata letak grid 2x2 yang lapang di drawer desktop maupun mobile untuk mencegah teks saling bertumpuk.
  - Filter Transfer khusus: hanya muncul ketika tipe transaksi Transfer dipilih, menyediakan pilihan Sumber Dana (Rekening Asal) dan Tujuan Transfer (Rekening Tujuan).
  - Filter Rekening dan Kategori: tersedia saat tipe bukan Transfer untuk mempersempit hasil transaksi.
  - Rentang Nominal: menyediakan input nominal minimum dan maksimum dalam rupiah (Rp Min - Rp Max) dengan format mata uang otomatis.
  - Urutkan: dropdown pilihan pengurutan transaksi (Terbaru, Terlama, Terbesar, Terkecil).
- Badge Filter Aktif: setiap filter yang dipilih ditampilkan di bawah baris pencarian sebagai badge pill yang dapat ditutup satu per satu tanpa harus membuka panel filter.
- Tombol "Hapus Semua" tersedia di samping badge aktif untuk menghapus seluruh filter aktif sekaligus.
- Pada daftar transaksi di mobile, metadata tanggal dan waktu dijaga tetap utuh (`whitespace-nowrap`). Khusus transaksi bertipe Transfer, alur perpindahan dana (`Rekening Asal → Rekening Tujuan`) ditampilkan pada baris terpisah di bawah baris waktu dengan `truncate` otomatis. Hal ini mencegah teks nama rekening dan simbol panah/titik pecah menjadi kolom-kolom bertumpuk yang berantakan pada layar ponsel yang sempit.
- Query `?new=true` membuka dialog transaksi baru otomatis.
- Dialog mendukung mode create, edit, copy, dan correction readonly behavior.
- Dialog mobile dipusatkan di area aman dan memisahkan frame tetap dari scroll container form. Struktur ini menjaga tombol aksi tetap normal setelah momentum scroll cepat di iOS/PWA.
- Tanggal default dialog create normal mengikuti tanggal/periode yang sedang dipilih di halaman transaksi; waktu tetap memakai waktu saat dialog dibuka.
- Field kategori hanya tampil untuk income/expense.
- Field rekening tujuan hanya tampil untuk transfer.
- **Proteksi & Auto-Switch Rekening Transfer (`rekening_id` & `rekening_tujuan`)**:
  - Pada transaksi bertipe Transfer, Rekening Asal dan Rekening Tujuan diproteksi agar tidak dapat bernilai sama.
  - Dropdown Rekening Tujuan menonaktifkan opsi rekening asal yang sedang dipilih (`disabledValues`) dengan label `(Rekening asal)` ketika tujuan belum dipilih atau ketika rekening asal terkunci.
  - Mekanisme *Auto-Switch*: jika Rekening Asal adalah X dan Rekening Tujuan adalah Y, lalu pengguna memilih opsi Y pada Rekening Asal, sistem otomatis menukar posisi (*swap*) sehingga Rekening Asal menjadi Y dan Rekening Tujuan menjadi X (berlaku simetris pada Rekening Tujuan jika tidak terkunci).
  - Tombol interaktif "Tukar Rekening" dengan ikon panah bolak-balik (`ArrowUpDown`) tersedia di sebelah label Rekening Tujuan saat kedua rekening telah terisi dan tidak sedang terkunci.
  - Pada level form validation dan Server Action, transaksi transfer dengan rekening asal dan tujuan yang sama akan ditolak secara ketat.
- Dialog membersihkan field yang tidak relevan saat tipe transaksi berubah, misalnya kategori untuk transfer dan rekening tujuan untuk non-transfer.
- Judul suggestion diambil dari histori transaksi.
- Input suara memakai browser Speech Recognition dan Gemini parser server-side.
- Tombol Auto Fill berada di sebelah Voice Input pada mode tambah transaksi.
- Voice Input dan Auto Fill memakai dua kolom dengan lebar serta tinggi tombol yang seragam pada mobile.
- Footer edit transaksi menampilkan Copy, Batal, dan Perbarui dalam satu baris tiga kolom pada mobile; mode tanpa Copy memakai dua kolom.
- Auto Fill menerima satu file JPEG, PNG, WebP, HEIC/HEIF, atau PDF maksimal 4 MB dan langsung menganalisis file setelah dipilih.
- File Auto Fill hanya diproses sementara di memory request, tidak disimpan ke Supabase Storage/database, dan hasil AI tidak membuat transaksi sampai user menekan `Simpan`.
- Hanya field yang dikenali dengan cukup yakin yang menimpa form. Kategori dan rekening dipilih otomatis hanya jika ada satu kecocokan nama/logo yang kuat.
- Jika satu file memuat beberapa transaksi, transaksi pertama mengisi form dan UI memberi informasi bahwa hasil lain perlu dimasukkan terpisah.
- Voice Input dan Auto Fill tidak dapat berjalan bersamaan. Auto Fill bersifat online-only.
- Saat offline, create/update/delete transaksi dapat masuk ke IndexedDB queue.
- Pending transaksi offline ditampilkan sebagai data sementara dengan status menunggu sinkronisasi.
- **Drawer Detail Transaksi (`TransaksiDetailSheet`) & Komponen Detail (`TransaksiDetailContent`)**:
  - Pengguna dapat melihat detail transaksi secara cepat tanpa berpindah halaman melalui tombol ikon mata (`Detail`) pada baris transaksi atau dengan mengklik baris transaksi tersebut.
  - Pada index daftar transaksi, transaksi bertipe Transfer dan Koreksi Saldo selalu menggunakan nama default sebagai judul (tidak di-override oleh catatan transaksi) serta menyembunyikan badge label tipe agar tampilan ringkas dan tidak redundan.
  - Mengikuti pola responsif yang konsisten dengan Filter Transaksi: fullscreen drawer meluncur dari bawah ke atas pada mobile dengan safe-area insets, dan right-side sheet pada layar desktop.
  - Hero card menyajikan ikon tipe bulat tetap (fixed circular type icon dengan aksen warna semantik, tidak mengikuti emoji kategori), label tipe kapital semantik, nominal besar (`font-mono`), baris tanggal dan waktu tepat di bawah nominal (`[Tanggal] - [Waktu]`), serta badge status (`_pendingSync` / `is_recurring`).
  - Untuk transaksi transfer, alur perpindahan rekening disajikan secara vertikal dengan panah ke bawah (`ArrowDown`) yang menghubungkan Rekening Asal dan Rekening Tujuan.
  - Untuk transaksi non-transfer, informasi Rekening, Judul (jika ada), dan Kategori (jika ada) disatukan dalam satu card metadata.
  - Bagian Catatan dan Tag disajikan di card terpisah, sedangkan ID Referensi transaksi diletakkan rapi di posisi paling bawah.
  - Tag sistem internal (`correction_add`, `correction_sub`) otomatis disaring dari UI dan dimanfaatkan untuk menentukan arah koreksi saldo ("Penambahan" vs "Pengurangan").
  - Footer drawer menyajikan tombol Hapus Transaksi (dilengkapi dialog konfirmasi), Copy Transaksi (membuka modal create yang langsung di-prefill dengan data transaksi untuk duplikasi instan), dan Edit Transaksi sebagai tombol aksi utama.
- **Paginasi Transaksi (`TransaksiPagination`)**:
  - Ditempatkan di bawah daftar transaksi dengan opsi jumlah baris: `10`, `25`, `50`, dan `100` data per halaman (default: `50`).
  - Mengikuti kontrak desain `DESIGN.md`: tombol navigasi berwujud pill (`rounded-full`), penomoran halaman dan jumlah data menggunakan font monospace Geist Mono (`font-mono`), border tipis (`border-hairline`), dan tampilan flat tanpa shadow default.
  - Tampilan responsif:
    - Desktop: menampilkan dropdown baris per halaman di sisi kiri, info rentang data (misal `Menampilkan 1-50 dari 1.284 data`), dan tombol navigasi bernomor lengkap dengan smart ellipsis (`1 2 3 … 26`) serta tombol Prev/Next di sisi kanan.
    - Mobile: disusun dalam dua baris ringkas yang tidak overflow (baris atas: info data dan dropdown baris; baris bawah: tombol Prev, indikator halaman `Hal 1 / 26`, dan tombol Next).
  - Perpindahan halaman atau perubahan ukuran halaman otomatis melakukan *smooth scroll* kembali ke bagian atas daftar transaksi secara halus.
  - Reset otomatis ke halaman 1 saat filter, pencarian teks, atau preset tanggal aktif berubah.
  - Kartu ringkasan keuangan (`TransaksiSummaryCard`) dan badge total header tetap menghitung akumulasi total seluruh data yang terfilter, bukan hanya data pada halaman aktif.
- **Dukungan Volume Data Besar (`fetchAllRows`)**:
  - Query transaksi dan server action terkait (termasuk export data dan rekap/laporan) menggunakan utilitas paging otomatis `fetchAllRows` (`src/lib/supabase-fetch.ts`) sehingga dapat memuat data melampaui batas default 1.000 baris PostgREST secara utuh dan aman.

## TODO / Improvement

- Review apakah update/delete offline untuk semua skenario sudah memiliki feedback konflik data yang cukup.
- Jika recurring transaction diaktifkan, tambahkan UI dan dokumentasi khusus recurring.
