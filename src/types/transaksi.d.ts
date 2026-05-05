export type Kategori = {
  id: string;
  user_id: string | null;
  nama: string;
  ikon: string;
  warna: string;
  tipe: 'income' | 'expense' | 'all';
  is_system: boolean;
  created_at: string;
};

export type TipeTransaksi = 'income' | 'expense' | 'transfer';

export type Transaksi = {
  id: string;
  user_id: string;
  tipe: TipeTransaksi;
  nominal: number;
  tanggal: string;
  waktu: string;
  kategori_id: string | null;
  rekening_id: string | null;
  rekening_tujuan: string | null;
  catatan: string | null;
  tags: string[];
  is_recurring: boolean;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  kategori?: Kategori;
  rekening?: { id: string; nama: string; jenis: string; logo: string | null; warna: string };
  rekening_tujuan_data?: { id: string; nama: string; jenis: string; logo: string | null; warna: string };
};

export type TransaksiFormValues = {
  tipe: TipeTransaksi;
  nominal: number;
  tanggal: string;
  waktu?: string;
  kategori_id?: string;
  rekening_id: string;
  rekening_tujuan?: string;
  catatan?: string;
  tags?: string[];
  is_recurring?: boolean;
};

export type TransaksiFilter = {
  tipe?: TipeTransaksi | 'all';
  rekening_id?: string;
  kategori_id?: string;
  dari?: string;
  sampai?: string;
  q?: string;
};

export type IntervalRecurring = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export type RecurringTransaksi = {
  id: string;
  user_id: string;
  tipe: TipeTransaksi;
  nominal: number;
  kategori_id: string | null;
  rekening_id: string | null;
  rekening_tujuan: string | null;
  catatan: string | null;
  tags: string[];
  interval_type: IntervalRecurring;
  next_run: string;
  is_active: boolean;
  created_at: string;
};
