# Server Actions Reference

Semua operasi database dilakukan via **Next.js Server Actions** di `src/actions/`.
Server Actions selalu memiliki `'use server'` di atas file.

---

## auth-action.ts

| Fungsi | Parameter | Return | Keterangan |
|---|---|---|---|
| `signUp(formData)` | `FormData` (email, password, name) | `ActionResult` | Daftar akun baru |
| `signIn(formData)` | `FormData` (email, password) | `ActionResult` | Login → redirect `/transaksi` |
| `signOut()` | — | void | Logout → redirect `/login` |
| `getUser()` | — | `User \| null` | Ambil user aktif dari session |

---

## transaksi-action.ts

| Fungsi | Parameter | Return | Keterangan |
|---|---|---|---|
| `getKategori()` | — | `Kategori[]` | Semua kategori (sistem + milik user) |
| `getTransaksi(filter?)` | `TransaksiFilter` | `Transaksi[]` | Daftar transaksi dengan join |
| `createTransaksi(values)` | `TransaksiFormValues` | `ActionResult<Transaksi>` | Tambah transaksi |
| `updateTransaksi(id, values)` | string, Partial | `ActionResult<Transaksi>` | Edit transaksi |
| `deleteTransaksi(id)` | string | `ActionResult` | Hapus transaksi |
| `suggestKategori(catatan)` | string | `string \| null` | Auto-suggest kategori berdasarkan histori |

### TransaksiFilter Shape
```ts
type TransaksiFilter = {
  tipe?: 'income' | 'expense' | 'transfer' | 'all';
  rekening_id?: string;
  kategori_id?: string;
  dari?: string;   // YYYY-MM-DD
  sampai?: string; // YYYY-MM-DD
  q?: string;      // search catatan
}
```

---

## rekening-action.ts

| Fungsi | Parameter | Return | Keterangan |
|---|---|---|---|
| `getRekening()` | — | `Rekening[]` | Daftar rekening, urut by `urutan` |
| `createRekening(values)` | `RekeningFormValues` | `ActionResult<Rekening>` | Saldo awal = saldo saat ini |
| `updateRekening(id, values)` | string, Partial | `ActionResult<Rekening>` | Update data rekening |
| `deleteRekening(id)` | string | `ActionResult` | Hapus rekening |
| `toggleExcludeTotal(id, exclude)` | string, boolean | `ActionResult` | Include/exclude dari total saldo |

---

## hutang-action.ts

| Fungsi | Parameter | Return | Keterangan |
|---|---|---|---|
| `getHutang()` | — | `Hutang[]` | Daftar hutang + cicilan joined |
| `createHutang(values)` | `HutangFormValues` | `ActionResult<Hutang>` | `sisa_tagihan = total_pinjaman` awal |
| `updateHutang(id, values)` | string, Partial | `ActionResult` | Edit hutang |
| `deleteHutang(id)` | string | `ActionResult` | Hapus hutang + semua cicilan |
| `createCicilan(values)` | `CicilanFormValues` | `ActionResult<HutangCicilan>` | Trigger auto-update sisa |
| `deleteCicilan(id)` | string | `ActionResult` | Hapus cicilan, sisa ter-recalculate |
| `markHutangLunas(id)` | string | `ActionResult` | Set status=lunas, sisa=0 |

---

## rekap-action.ts

| Fungsi | Parameter | Return | Keterangan |
|---|---|---|---|
| `getRekapBulanan(tahun)` | number | `RekapBulanan[]` | Income/expense per bulan (12 item) |
| `getRekapKategori(bulan, tahun)` | number, number | `RekapKategori[]` | Breakdown expense by kategori |
| `getBudgetWithUsage(bulan, tahun)` | number, number | `BudgetWithUsage[]` | Budget + usage + status |
| `upsertBudget(kategori_id, bulan, tahun, limit)` | — | `ActionResult` | Buat atau update budget |

### BudgetWithUsage Shape
```ts
type BudgetWithUsage = {
  id: string;
  kategori_nama: string;
  kategori_ikon: string;
  limit_nominal: number;
  total_dipakai: number;
  persentase: number;      // 0–100
  status: 'aman' | 'waspada' | 'bahaya'; // <70% | 70-90% | >90%
}
```

---

## Pola ActionResult

Semua mutasi mengembalikan `ActionResult<T>`:

```ts
// src/types/general.d.ts
type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };
```

**Cara pakai di Client Component:**
```ts
const res = await createTransaksi(values);
if (res.success && res.data) {
  toast.success('Berhasil');
  // gunakan res.data
} else {
  toast.error(res.error ?? 'Gagal');
}
```

---

## revalidatePath

Setiap mutasi memanggil `revalidatePath()` untuk membersihkan Next.js cache:

```ts
// Setelah create/update/delete transaksi:
revalidatePath('/transaksi');
revalidatePath('/rekening'); // saldo berubah
revalidatePath('/rekap');    // grafik berubah
```
