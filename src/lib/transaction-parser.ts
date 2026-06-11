import "server-only";

import { Type } from "@google/genai";
import { isValid, parseISO } from "date-fns";
import type {
  ParsedTransaction,
  ParsedTransactionFlag,
  ParsedTransactionTipe,
} from "@/types/transaction-parser";

export const PARSED_TRANSACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tipe: { type: Type.STRING },
    nominal: { type: Type.NUMBER },
    tanggal: { type: Type.STRING },
    waktu: { type: Type.STRING },
    kategori_hint: { type: Type.STRING },
    rekening_hint: { type: Type.STRING },
    rekening_tujuan_hint: { type: Type.STRING },
    judul: { type: Type.STRING },
    catatan: { type: Type.STRING },
    entitas: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    needs_clarification: { type: Type.BOOLEAN },
    clarification_fields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    flags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "tipe",
    "nominal",
    "tanggal",
    "waktu",
    "kategori_hint",
    "rekening_hint",
    "rekening_tujuan_hint",
    "judul",
    "catatan",
    "entitas",
    "confidence",
    "needs_clarification",
    "clarification_fields",
    "flags",
  ],
};

const VALID_TIPE = new Set<ParsedTransactionTipe>([
  "expense",
  "income",
  "transfer",
  "hutang_baru",
  "piutang_baru",
  "bayar_hutang",
]);

const VALID_FLAGS = new Set<ParsedTransactionFlag>([
  "nominal_missing",
  "nominal_ambigu",
  "tanggal_ambigu",
  "tipe_ambigu",
  "rekening_ambigu",
  "multiple_transactions",
  "stt_noise",
  "document_low_quality",
  "total_ambigu",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : "";
}

function sanitizeDate(value: unknown, fallbackDate: string): string {
  if (typeof value !== "string") return fallbackDate;

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return fallbackDate;

  return isValid(parseISO(normalized)) ? normalized : fallbackDate;
}

function sanitizeTime(value: unknown): string {
  if (typeof value !== "string") return "";

  const normalized = value.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(normalized) ? normalized : "";
}

function sanitizeFlags(value: unknown): ParsedTransactionFlag[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.filter(
        (flag): flag is ParsedTransactionFlag =>
          typeof flag === "string" &&
          VALID_FLAGS.has(flag as ParsedTransactionFlag),
      ),
    ),
  );
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => cleanString(item, 60))
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

export function sanitizeParsedTransaction(
  value: unknown,
  fallbackDate = "",
): ParsedTransaction {
  const raw = asRecord(value);
  const flags = sanitizeFlags(raw.flags);
  const rawTipe =
    typeof raw.tipe === "string" ? (raw.tipe as ParsedTransactionTipe) : null;
  const tipe = rawTipe && VALID_TIPE.has(rawTipe) ? rawTipe : "expense";

  if ((!rawTipe || !VALID_TIPE.has(rawTipe)) && !flags.includes("tipe_ambigu")) {
    flags.push("tipe_ambigu");
  }

  const numericNominal = Number(raw.nominal);
  const nominal =
    Number.isFinite(numericNominal) && numericNominal > 0
      ? Math.round(numericNominal)
      : 0;

  if (nominal === 0 && !flags.includes("nominal_missing")) {
    flags.push("nominal_missing");
  }

  const tanggal = sanitizeDate(raw.tanggal, fallbackDate);
  const clarificationFields = sanitizeStringArray(raw.clarification_fields);

  if (nominal === 0 && !clarificationFields.includes("nominal")) {
    clarificationFields.push("nominal");
  }

  if (
    flags.includes("rekening_ambigu") &&
    !clarificationFields.includes("rekening")
  ) {
    clarificationFields.push("rekening");
  }

  if (
    flags.includes("tipe_ambigu") &&
    !clarificationFields.includes("tipe")
  ) {
    clarificationFields.push("tipe");
  }

  const rawConfidence = Number(raw.confidence);
  const confidence = Number.isFinite(rawConfidence)
    ? Math.min(1, Math.max(0, rawConfidence))
    : 0.5;

  return {
    tipe,
    nominal,
    tanggal,
    waktu: sanitizeTime(raw.waktu),
    kategori_hint: cleanString(raw.kategori_hint, 100),
    rekening_hint: cleanString(raw.rekening_hint, 100),
    rekening_tujuan_hint: cleanString(raw.rekening_tujuan_hint, 100),
    judul: cleanString(raw.judul, 200),
    catatan: cleanString(raw.catatan, 500),
    entitas: cleanString(raw.entitas, 150),
    confidence,
    needs_clarification:
      raw.needs_clarification === true ||
      clarificationFields.length > 0 ||
      confidence < 0.6,
    clarification_fields: clarificationFields,
    flags,
  };
}

export function cleanStructuredJson(rawText: string): string {
  return rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function getErrorStatus(error: unknown): number | undefined {
  const record = asRecord(error);
  return typeof record.status === "number" ? record.status : undefined;
}

export function isGeminiQuotaError(error: unknown): boolean {
  const status = getErrorStatus(error);
  const message = error instanceof Error ? error.message : String(error);

  return (
    status === 429 ||
    message.includes("quota") ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}
