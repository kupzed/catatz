export type VoiceTipe =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'hutang_baru'
  | 'piutang_baru'
  | 'bayar_hutang'

export type VoiceFlag =
  | 'nominal_missing'
  | 'nominal_ambigu'
  | 'tanggal_ambigu'
  | 'tipe_ambigu'
  | 'rekening_ambigu'
  | 'multiple_transactions'
  | 'stt_noise'

export type VoiceTransaction = {
  tipe: VoiceTipe
  nominal: number
  tanggal: string              // YYYY-MM-DD
  waktu: string                // HH:mm (24-hour), kosong "" jika tidak disebutkan
  kategori_hint: string
  rekening_hint: string
  rekening_tujuan_hint: string
  judul: string
  catatan: string
  entitas: string
  confidence: number
  needs_clarification: boolean
  clarification_fields: string[]
  flags: VoiceFlag[]
}

export type VoiceParseResult = {
  transactions: VoiceTransaction[]
  raw_input: string
  parse_summary: string
}

// Tipe yang sudah divalidasi Zod, siap dikirim ke Server Action
export type ValidatedVoiceTransaction = VoiceTransaction & {
  _validated: true
}
