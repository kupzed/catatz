import type { Rekening } from "@/types/rekening";
import type { Kategori } from "@/types/transaksi";
import type {
  ParsedTransaction,
  ParsedTransactionTipe,
} from "@/types/transaction-parser";

type MatchResult<T> = {
  match: T | null;
  warning?: string;
};

export type AutoFillResolution = {
  tipe: "income" | "expense" | "transfer" | null;
  judul: string;
  catatan: string;
  kategoriId: string | null;
  rekeningId: string | null;
  rekeningTujuanId: string | null;
  warnings: string[];
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreAlias(hint: string, alias: string) {
  const normalizedHint = normalize(hint);
  const normalizedAlias = normalize(alias);
  if (!normalizedHint || !normalizedAlias) return 0;
  if (normalizedHint === normalizedAlias) return 3;

  const hintTokens = normalizedHint.split(" ");
  const aliasTokens = normalizedAlias.split(" ");
  const hintContainsAlias = aliasTokens.every((token) =>
    hintTokens.includes(token),
  );
  const aliasContainsHint = hintTokens.every((token) =>
    aliasTokens.includes(token),
  );

  if (
    (hintContainsAlias || aliasContainsHint) &&
    Math.min(normalizedHint.length, normalizedAlias.length) >= 3
  ) {
    return 2;
  }

  return 0;
}

function findUniqueStrongMatch<T>(
  hint: string,
  items: T[],
  aliases: (item: T) => Array<string | null | undefined>,
  label: string,
): MatchResult<T> {
  if (!hint.trim()) return { match: null };

  const scored = items
    .map((item) => ({
      item,
      score: Math.max(...aliases(item).map((alias) => scoreAlias(hint, alias ?? ""))),
    }))
    .filter((candidate) => candidate.score >= 2)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      match: null,
      warning: `${label} "${hint}" belum dapat dicocokkan.`,
    };
  }

  const bestScore = scored[0].score;
  const bestMatches = scored.filter((candidate) => candidate.score === bestScore);
  if (bestMatches.length !== 1) {
    return {
      match: null,
      warning: `${label} "${hint}" cocok dengan beberapa pilihan.`,
    };
  }

  return { match: bestMatches[0].item };
}

function getFormTipe(
  transaction: ParsedTransaction,
): AutoFillResolution["tipe"] {
  if (transaction.flags.includes("tipe_ambigu")) return null;
  if (
    transaction.tipe === "income" ||
    transaction.tipe === "expense" ||
    transaction.tipe === "transfer"
  ) {
    return transaction.tipe;
  }

  return null;
}

function getEntityFallback(
  transaction: ParsedTransaction,
  tipe: ParsedTransactionTipe,
) {
  if (!transaction.entitas) return "";
  if (tipe === "transfer") return `Transfer terkait ${transaction.entitas}`;
  return "";
}

export function resolveAutoFillTransaction(
  transaction: ParsedTransaction,
  kategori: Kategori[],
  rekening: Rekening[],
): AutoFillResolution {
  const warnings: string[] = [];
  const tipe = getFormTipe(transaction);
  const effectiveTipe = tipe ?? transaction.tipe;
  const categoryMatch =
    tipe === "income" || tipe === "expense"
      ? findUniqueStrongMatch(
          transaction.kategori_hint,
          kategori.filter(
            (item) => item.tipe === tipe || item.tipe === "all",
          ),
          (item) => [item.nama],
          "Kategori",
        )
      : { match: null };
  const accountMatch = findUniqueStrongMatch(
    transaction.rekening_hint,
    rekening,
    (item) => [item.nama, item.logo],
    "Rekening",
  );
  const targetAccountMatch =
    tipe === "transfer"
      ? findUniqueStrongMatch(
          transaction.rekening_tujuan_hint,
          rekening,
          (item) => [item.nama, item.logo],
          "Rekening tujuan",
        )
      : { match: null };

  for (const result of [categoryMatch, accountMatch, targetAccountMatch]) {
    if (result.warning) warnings.push(result.warning);
  }

  if (tipe === null && transaction.flags.includes("tipe_ambigu")) {
    warnings.push("Jenis transaksi belum cukup jelas.");
  }

  if (
    transaction.flags.includes("nominal_ambigu") ||
    transaction.flags.includes("total_ambigu")
  ) {
    warnings.push("Nominal transaksi perlu diperiksa.");
  }

  return {
    tipe,
    judul:
      transaction.judul ||
      (effectiveTipe !== "transfer" ? transaction.entitas : ""),
    catatan:
      transaction.catatan ||
      getEntityFallback(transaction, effectiveTipe),
    kategoriId: categoryMatch.match?.id ?? null,
    rekeningId: accountMatch.match?.id ?? null,
    rekeningTujuanId: targetAccountMatch.match?.id ?? null,
    warnings,
  };
}
