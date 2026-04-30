// Bank and E-Wallet constants for rekening selection UI

export type BankSlug = string;

export type BankInfo = {
  slug: string;
  nama: string;
  jenis: 'Bank' | 'E-Wallet' | 'Tunai' | 'Investasi';
  warna: string; // Brand color
  emoji?: string;
};

export const DAFTAR_BANK: BankInfo[] = [
  // ── Tunai
  { slug: 'tunai',    nama: 'Tunai',          jenis: 'Tunai',      warna: '#6b7280', emoji: '💵' },

  // ── Bank Nasional
  { slug: 'bca',      nama: 'BCA',            jenis: 'Bank',       warna: '#005baa' },
  { slug: 'mandiri',  nama: 'Mandiri',        jenis: 'Bank',       warna: '#003d7a' },
  { slug: 'bni',      nama: 'BNI',            jenis: 'Bank',       warna: '#f47920' },
  { slug: 'bri',      nama: 'BRI',            jenis: 'Bank',       warna: '#00a0e4' },
  { slug: 'cimb',     nama: 'CIMB Niaga',     jenis: 'Bank',       warna: '#e2003a' },
  { slug: 'danamon',  nama: 'Danamon',        jenis: 'Bank',       warna: '#e4003a' },
  { slug: 'permata',  nama: 'Permata',        jenis: 'Bank',       warna: '#e4003a' },
  { slug: 'btn',      nama: 'BTN',            jenis: 'Bank',       warna: '#003d7a' },
  { slug: 'ocbc',     nama: 'OCBC',           jenis: 'Bank',       warna: '#e4003a' },
  { slug: 'bsi',      nama: 'BSI',            jenis: 'Bank',       warna: '#00703c' },
  { slug: 'maybank',  nama: 'Maybank',        jenis: 'Bank',       warna: '#f6a800' },
  { slug: 'mega',     nama: 'Bank Mega',      jenis: 'Bank',       warna: '#e4003a' },
  { slug: 'panin',    nama: 'Panin',          jenis: 'Bank',       warna: '#003d7a' },
  { slug: 'jago',     nama: 'Bank Jago',      jenis: 'Bank',       warna: '#007f5f' },
  { slug: 'seabank',  nama: 'SeaBank',        jenis: 'Bank',       warna: '#ee2d24' },
  { slug: 'neo',      nama: 'Bank Neo',       jenis: 'Bank',       warna: '#1e40af' },
  { slug: 'allo',     nama: 'Allo Bank',      jenis: 'Bank',       warna: '#0ea5e9' },

  // ── E-Wallet
  { slug: 'gopay',    nama: 'GoPay',          jenis: 'E-Wallet',   warna: '#00aed6' },
  { slug: 'ovo',      nama: 'OVO',            jenis: 'E-Wallet',   warna: '#4c3494' },
  { slug: 'dana',     nama: 'DANA',           jenis: 'E-Wallet',   warna: '#118eda' },
  { slug: 'shopeepay',nama: 'ShopeePay',     jenis: 'E-Wallet',   warna: '#ee4d2d' },
  { slug: 'linkaja',  nama: 'LinkAja',        jenis: 'E-Wallet',   warna: '#e4003a' },
  { slug: 'qris',     nama: 'QRIS',           jenis: 'E-Wallet',   warna: '#e4003a' },

  // ── Investasi
  { slug: 'bibit',    nama: 'Bibit',          jenis: 'Investasi',  warna: '#00c48c' },
  { slug: 'bareksa',  nama: 'Bareksa',        jenis: 'Investasi',  warna: '#f47920' },
  { slug: 'ajaib',    nama: 'Ajaib',          jenis: 'Investasi',  warna: '#0066cc' },
  { slug: 'stockbit', nama: 'Stockbit',       jenis: 'Investasi',  warna: '#0047ab' },
  { slug: 'pluang',   nama: 'Pluang',         jenis: 'Investasi',  warna: '#f4a300' },
];

export const getBankBySlug = (slug: string): BankInfo | undefined =>
  DAFTAR_BANK.find((b) => b.slug === slug);

// Grouped for bottom sheet UI
export const BANK_BY_JENIS = DAFTAR_BANK.reduce<Record<string, BankInfo[]>>(
  (acc, bank) => {
    if (!acc[bank.jenis]) acc[bank.jenis] = [];
    acc[bank.jenis].push(bank);
    return acc;
  },
  {}
);
