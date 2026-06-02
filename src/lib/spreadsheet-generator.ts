"use client";

import type { ExportSummary, ExportTransaksi } from "@/actions/export-action";
import type { Worksheet } from "exceljs";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/lib/user-preferences";
import {
  formatNumber,
  getRupiahSpreadsheetFormat,
} from "@/lib/utils";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV_MIME = "text/csv;charset=utf-8";
const HEADER_FILL = "FF0052FF";
const HEADER_TEXT = "FFFFFFFF";
const HAIRLINE = "FFDEE1E6";

type TransactionExportRow = {
  no: number;
  tanggal: string;
  waktu: string;
  tipe: string;
  judul: string;
  kategori: string;
  catatan: string;
  rekening: string;
  rekening_tujuan: string;
  nominal: number;
};

function fileDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function sanitizeSpreadsheetText(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (/^\s*[=+@]/.test(normalized) || /^\s*-(?!$|\d)/.test(normalized)) {
    return `'${normalized}`;
  }

  return normalized;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toTransactionRows(
  transaksi: ExportTransaksi[],
): TransactionExportRow[] {
  return transaksi.map((t, index) => ({
    no: index + 1,
    tanggal: t.tanggal,
    waktu: t.waktu,
    tipe: t.tipe,
    judul: sanitizeSpreadsheetText(t.judul),
    kategori: sanitizeSpreadsheetText(t.kategori),
    catatan: sanitizeSpreadsheetText(t.catatan),
    rekening: sanitizeSpreadsheetText(t.rekening),
    rekening_tujuan: sanitizeSpreadsheetText(t.rekening_tujuan),
    nominal: t.nominal,
  }));
}

function styleHeaderRow(sheet: Worksheet, rowNumber = 1): void {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: HEADER_TEXT } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  row.alignment = { vertical: "middle", wrapText: true };

  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: HEADER_FILL } },
      left: { style: "thin", color: { argb: HEADER_FILL } },
      bottom: { style: "thin", color: { argb: HEADER_FILL } },
      right: { style: "thin", color: { argb: HEADER_FILL } },
    };
  });
}

function styleBodyRows(sheet: Worksheet, startRow = 2): void {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return;

    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin", color: { argb: HAIRLINE } },
      };
    });
  });
}

function addSummarySheet(
  workbook: import("exceljs").Workbook,
  summary: ExportSummary,
  userName: string,
  preferences: UserPreferences,
): void {
  const rupiahNumberFormat = getRupiahSpreadsheetFormat(preferences);
  const sheet = workbook.addWorksheet("Ringkasan", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  sheet.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 28 },
  ];

  sheet.mergeCells("A1:B1");
  sheet.getCell("A1").value = "CatatZ Laporan Keuangan";
  sheet.getCell("A1").font = {
    bold: true,
    size: 16,
    color: { argb: HEADER_TEXT },
  };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getRow(1).height = 24;

  sheet.addRow([]);
  sheet.addRows([
    ["Nama Pengguna", sanitizeSpreadsheetText(userName)],
    ["Periode", sanitizeSpreadsheetText(summary.periode)],
    ["Total Pemasukan", summary.total_income],
    ["Total Pengeluaran", summary.total_expense],
    ["Selisih Bersih", summary.net],
    ["Jumlah Pemasukan", summary.count_income],
    ["Jumlah Pengeluaran", summary.count_expense],
    ["Jumlah Transfer", summary.count_transfer],
  ]);

  [5, 6, 7].forEach((rowNumber) => {
    sheet.getCell(`B${rowNumber}`).numFmt = rupiahNumberFormat;
  });

  sheet.getColumn(1).font = { bold: true };
  styleBodyRows(sheet, 3);

  if (summary.kategori_breakdown.length > 0) {
    const categoryHeaderRow = sheet.addRow([]);
    const headerRowNumber = categoryHeaderRow.number + 1;

    sheet.addRow(["Kategori Pengeluaran", "Nominal", "Persentase"]);
    summary.kategori_breakdown.forEach((item) => {
      sheet.addRow([
        sanitizeSpreadsheetText(item.nama),
        item.total,
        item.persentase / 100,
      ]);
    });

    sheet.getColumn(3).width = 14;
    styleHeaderRow(sheet, headerRowNumber);
    sheet.getColumn(2).numFmt = rupiahNumberFormat;
    sheet.getColumn(3).numFmt = "0.00%";
  }
}

function addTransactionsSheet(
  workbook: import("exceljs").Workbook,
  transaksi: ExportTransaksi[],
  preferences: UserPreferences,
): void {
  const rupiahNumberFormat = getRupiahSpreadsheetFormat(preferences);
  const sheet = workbook.addWorksheet("Transaksi", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "No", key: "no", width: 8 },
    { header: "Tanggal", key: "tanggal", width: 16 },
    { header: "Waktu", key: "waktu", width: 10 },
    { header: "Tipe", key: "tipe", width: 16 },
    { header: "Judul", key: "judul", width: 28 },
    { header: "Kategori", key: "kategori", width: 20 },
    { header: "Catatan", key: "catatan", width: 36 },
    { header: "Rekening", key: "rekening", width: 22 },
    { header: "Rekening Tujuan", key: "rekening_tujuan", width: 22 },
    { header: "Nominal", key: "nominal", width: 18 },
  ];

  sheet.addRows(toTransactionRows(transaksi));
  sheet.getColumn("nominal").numFmt = rupiahNumberFormat;
  styleHeaderRow(sheet);
  styleBodyRows(sheet);
  sheet.autoFilter = "A1:J1";
}

function csvCell(value: string | number): string {
  const text =
    typeof value === "number" ? String(value) : sanitizeSpreadsheetText(value);

  return `"${text.replace(/"/g, '""')}"`;
}

export async function generateXLSX(
  transaksi: ExportTransaksi[],
  summary: ExportSummary,
  userName: string,
  preferences: UserPreferences = DEFAULT_USER_PREFERENCES,
): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "CatatZ";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = `CatatZ Laporan Keuangan ${summary.periode}`;
  workbook.subject = "Laporan Keuangan Pribadi";

  addSummarySheet(workbook, summary, userName, preferences);
  addTransactionsSheet(workbook, transaksi, preferences);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], { type: XLSX_MIME });

  downloadBlob(blob, `catatz-laporan-${fileDate()}.xlsx`);
}

export function generateCSV(
  transaksi: ExportTransaksi[],
  preferences: UserPreferences = DEFAULT_USER_PREFERENCES,
): void {
  const headers = [
    "No",
    "Tanggal",
    "Waktu",
    "Tipe",
    "Judul",
    "Kategori",
    "Catatan",
    "Rekening",
    "Rekening Tujuan",
    "Nominal",
  ];

  const rows = toTransactionRows(transaksi).map((row) => [
    row.no,
    row.tanggal,
    row.waktu,
    row.tipe,
    row.judul,
    row.kategori,
    row.catatan,
    row.rekening,
    row.rekening_tujuan,
    formatNumber(row.nominal, preferences),
  ]);

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: CSV_MIME });
  downloadBlob(blob, `catatz-transaksi-${fileDate()}.csv`);
}
