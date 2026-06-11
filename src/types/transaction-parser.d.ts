export type ParsedTransactionTipe =
  | "expense"
  | "income"
  | "transfer"
  | "hutang_baru"
  | "piutang_baru"
  | "bayar_hutang";

export type ParsedTransactionFlag =
  | "nominal_missing"
  | "nominal_ambigu"
  | "tanggal_ambigu"
  | "tipe_ambigu"
  | "rekening_ambigu"
  | "multiple_transactions"
  | "stt_noise"
  | "document_low_quality"
  | "total_ambigu";

export type ParsedTransaction = {
  tipe: ParsedTransactionTipe;
  nominal: number;
  tanggal: string;
  waktu: string;
  kategori_hint: string;
  rekening_hint: string;
  rekening_tujuan_hint: string;
  judul: string;
  catatan: string;
  entitas: string;
  confidence: number;
  needs_clarification: boolean;
  clarification_fields: string[];
  flags: ParsedTransactionFlag[];
};

export type ParsedTransactionResult = {
  transactions: ParsedTransaction[];
  parse_summary: string;
};

export type FileAutoFillResult = ParsedTransactionResult & {
  file_name: string;
};
