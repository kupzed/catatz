export type TipeHutang = 'memberi' | 'menerima';
export type StatusHutang = 'aktif' | 'lunas' | 'overdue';

export type Hutang = {
  id: string;
  user_id: string;
  tipe: TipeHutang;
  nama_entitas: string;
  total_pinjaman: number;
  sisa_tagihan: number;
  tanggal_mulai: string;
  tanggal_jatuh_tempo: string | null;
  status: StatusHutang;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  cicilan?: HutangCicilan[];
};

export type HutangCicilan = {
  id: string;
  hutang_id: string;
  nominal: number;
  tanggal: string;
  catatan: string | null;
  created_at: string;
};

export type HutangFormValues = {
  tipe: TipeHutang;
  nama_entitas: string;
  total_pinjaman: number;
  tanggal_mulai: string;
  tanggal_jatuh_tempo?: string;
  catatan?: string;
};

export type CicilanFormValues = {
  hutang_id: string;
  nominal: number;
  tanggal: string;
  catatan?: string;
};
