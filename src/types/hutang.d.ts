export type TipeHutang = 'memberi' | 'menerima';
export type StatusHutang = 'aktif' | 'lunas' | 'overdue';
export type JenisTransaksiHutang = 'pembayaran' | 'pinjaman';

export type Hutang = {
  id: string;
  user_id: string;
  tipe: TipeHutang;
  nama_entitas: string;
  total_pinjaman: number;
  sisa_tagihan: number;
  tanggal_mulai: string;
  tanggal_jatuh_tempo: string | null;
  waktu: string;
  rekening_id: string | null;
  status: StatusHutang;
  is_lunas_manual?: boolean;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  cicilan?: HutangCicilan[];
};

export type HutangCicilan = {
  id: string;
  hutang_id: string;
  rekening_id: string | null;
  nominal: number;
  tanggal: string;
  waktu: string;
  tipe_hutang_snapshot: TipeHutang;
  jenis_transaksi?: JenisTransaksiHutang;
  catatan: string | null;
  created_at: string;
};

export type HutangContactFormValues = {
  nama_entitas: string;
  catatan?: string;
};

export type HutangTransactionFormValues = {
  hutang_id: string;
  jenis_transaksi: JenisTransaksiHutang;
  nominal: number;
  tanggal: string;
  waktu?: string;
  rekening_id?: string;
  catatan?: string;
};

export type HutangFormValues = {
  tipe: TipeHutang;
  nama_entitas: string;
  total_pinjaman: number;
  tanggal_mulai: string;
  tanggal_jatuh_tempo?: string;
  waktu?: string;
  rekening_id?: string;
  catatan?: string;
};

export type CicilanFormValues = {
  hutang_id: string;
  rekening_id?: string;
  nominal: number;
  tanggal: string;
  waktu?: string;
  catatan?: string;
  jenis_transaksi?: JenisTransaksiHutang;
};

export type CicilanUpdateValues = Partial<
  Pick<
    CicilanFormValues,
    'rekening_id' | 'nominal' | 'tanggal' | 'waktu' | 'catatan' | 'jenis_transaksi'
  >
>;

