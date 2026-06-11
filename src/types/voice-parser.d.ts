import type {
  ParsedTransaction,
  ParsedTransactionFlag,
  ParsedTransactionTipe,
} from "./transaction-parser";

export type VoiceTipe = ParsedTransactionTipe;
export type VoiceFlag = ParsedTransactionFlag;
export type VoiceTransaction = ParsedTransaction;

export type VoiceParseResult = {
  transactions: VoiceTransaction[];
  raw_input: string;
  parse_summary: string;
};

// Tipe yang sudah divalidasi Zod, siap dikirim ke Server Action
export type ValidatedVoiceTransaction = VoiceTransaction & {
  _validated: true;
};
