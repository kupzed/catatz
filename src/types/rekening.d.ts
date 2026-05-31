export type JenisRekening = 'Tunai' | 'Bank' | 'E-Wallet' | 'Investasi';

export type Rekening = {
  id: string;
  user_id: string;
  nama: string;
  jenis: JenisRekening;
  saldo_awal: number;
  saldo_saat_ini: number;
  warna: string;
  logo: string | null;
  exclude_total: boolean;
  urutan: number;
  created_at: string;
  updated_at: string;
};

export type RekeningFormValues = {
  nama: string;
  jenis: JenisRekening;
  saldo_awal: number;
  warna: string;
  logo?: string;
  exclude_total: boolean;
};

export type RekeningUsageCounts = {
  transaksi_asal: number;
  transaksi_tujuan: number;
  hutang: number;
  hutang_cicilan: number;
  recurring_asal: number;
  recurring_tujuan: number;
  total: number;
};
