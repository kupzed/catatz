"use client";

import type { ExportTransaksi, ExportSummary } from "@/actions/export-action";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const COLORS = {
  indigo: [79, 70, 229] as [number, number, number], // #4F46E5
  indigoLight: [238, 242, 255] as [number, number, number], // #EEF2FF
  green: [22, 163, 74] as [number, number, number], // #16A34A
  greenLight: [240, 253, 244] as [number, number, number], // #F0FDF4
  red: [220, 38, 38] as [number, number, number], // #DC2626
  redLight: [255, 241, 242] as [number, number, number], // #FFF1F2
  blue: [29, 78, 216] as [number, number, number], // #1D4ED8
  blueLight: [239, 246, 255] as [number, number, number], // #EFF6FF
  amber: [217, 119, 6] as [number, number, number], // #D97706
  gray: [100, 116, 139] as [number, number, number], // #64748B
  grayLight: [248, 250, 252] as [number, number, number], // #F8FAFC
  grayBorder: [226, 232, 240] as [number, number, number], // #E2E8F0
  white: [255, 255, 255] as [number, number, number],
  black: [15, 23, 42] as [number, number, number], // #0F172A
};

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}

export async function generatePDF(
  transaksi: ExportTransaksi[],
  summary: ExportSummary,
  userName: string = "Pengguna",
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // Load logo
  let logoBase64 = "";
  try {
    const res = await fetch("/catatz.png");
    const blob = await res.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  doc.setProperties({
    title: `CatatZ — Laporan Keuangan ${summary.periode}`,
    subject: "Laporan Keuangan Pribadi",
    author: userName,
    creator: "CatatZ App",
  });

  function addPageFooter(pageNum: number, totalPages: number) {
    const yFooter = pageH - 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray);
    doc.text("CatatZ — Laporan digenerate otomatis.", margin, yFooter);
    doc.text(`Hal. ${pageNum} dari ${totalPages}`, pageW - margin, yFooter, {
      align: "right",
    });
    doc.setDrawColor(...COLORS.grayBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, yFooter - 3, pageW - margin, yFooter - 3);
  }

  function drawHeader() {
    // A. Background header (Dark)
    doc.setFillColor(...COLORS.black);
    doc.rect(0, 0, pageW, 32, "F");

    // B. Logo
    if (logoBase64 && logoBase64.startsWith("data:image")) {
      doc.addImage(logoBase64, "PNG", margin, 8, 10, 10);
    } else {
      // Fallback
      doc.setFillColor(...COLORS.white);
      doc.circle(margin + 5, 13, 5, "F");
      doc.setFillColor(...COLORS.black);
      doc.circle(margin + 5, 13, 2.5, "F");
    }

    // C. Nama app
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.white);
    doc.text("CatatZ", margin + 14, 14.5);

    // D. Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.setGState(doc.GState({ opacity: 0.7 }));
    doc.text(`Laporan Keuangan Periode (${summary.periode})`, margin + 14, 20);
    doc.setGState(doc.GState({ opacity: 1 }));

    // F. Nama user (di posisi kanan atas menggantikan Periode)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.white);
    doc.text(userName, pageW - margin, 14.5, { align: "right" });

    // Digenerate (kanan)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setGState(doc.GState({ opacity: 0.7 }));
    doc.text(
      `Digenerate: ${format(new Date(), "dd MMMM yyyy", { locale: id })}`,
      pageW - margin,
      20,
      { align: "right" },
    );
    doc.setGState(doc.GState({ opacity: 1 }));
  }

  function formatRupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  let y = 40;

  const cardW = (contentW - 8) / 3;
  const cards = [
    {
      label: "TOTAL PEMASUKAN",
      value: summary.total_income,
      count: `${summary.count_income} transaksi`,
      fillColor: COLORS.greenLight,
      textColor: COLORS.green,
      borderColor: [187, 247, 208] as [number, number, number],
    },
    {
      label: "TOTAL PENGELUARAN",
      value: summary.total_expense,
      count: `${summary.count_expense} transaksi`,
      fillColor: COLORS.redLight,
      textColor: COLORS.red,
      borderColor: [254, 205, 211] as [number, number, number],
    },
    {
      label: "SELISIH BERSIH",
      value: summary.net,
      count: summary.net >= 0 ? "surplus" : "defisit",
      fillColor: COLORS.indigoLight,
      textColor: COLORS.indigo,
      borderColor: [199, 210, 254] as [number, number, number],
    },
  ];

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 4);
    const cardH = 26;

    doc.setFillColor(...card.fillColor);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, "F");
    doc.setDrawColor(...card.borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...card.textColor);
    doc.text(card.label, x + 6, y + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(formatRupiah(card.value), x + 6, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray);
    doc.text(card.count, x + 6, y + 21);
  });

  y += 34;

  if (summary.kategori_breakdown.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.black);
    doc.text("Top 5 Pengeluaran per Kategori", margin, y);
    y += 5;

    summary.kategori_breakdown.forEach((item) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.gray);
      doc.text(item.nama, margin, y + 2.5);

      const barX = margin + 45;
      const barW = contentW - 45 - 20;

      doc.setFillColor(...COLORS.grayBorder);
      doc.roundedRect(barX, y, barW, 3, 1, 1, "F");

      if (item.persentase > 0) {
        doc.setFillColor(...hexToRgb(item.warna));
        doc.roundedRect(barX, y, barW * (item.persentase / 100), 3, 1, 1, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      doc.text(`${item.persentase.toFixed(1)}%`, pageW - margin, y + 2.5, {
        align: "right",
      });

      y += 8;
    });

    y += 8;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.black);
  doc.text("Rincian Transaksi", margin, y);
  y += 4;

  const tableData = transaksi.map((t, index) => [
    (index + 1).toString(),
    t.tanggal + (t.waktu !== "-" ? "\n" + t.waktu + " WIB" : ""),
    t.judul + "\n" + t.kategori,
    t.catatan,
    t.tipe === "Transfer"
      ? t.rekening +
        (t.rekening_tujuan !== "-" ? ` ke ${t.rekening_tujuan}` : "")
      : t.rekening,
    t.tipe,
    t.tipe === "Pemasukan"
      ? `+${formatRupiah(t.nominal)}`
      : t.tipe === "Pengeluaran"
        ? `-${formatRupiah(t.nominal)}`
        : formatRupiah(t.nominal),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { top: 38, left: margin, right: margin, bottom: 20 },
    head: [
      [
        "No",
        "Tanggal",
        "Judul & Kategori",
        "Catatan",
        "Rekening",
        "Tipe",
        "Nominal",
      ],
    ],
    body: tableData,

    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
      textColor: COLORS.black,
      lineColor: COLORS.grayBorder,
      lineWidth: 0.3,
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: COLORS.grayLight,
      textColor: COLORS.gray,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
    },

    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, // No
      1: { cellWidth: 22 }, // Tanggal
      2: { cellWidth: 30 }, // Judul & Kategori
      3: { cellWidth: 42 }, // Catatan
      4: { cellWidth: 33 }, // Rekening
      5: { cellWidth: 22, halign: "center" }, // Tipe
      6: { cellWidth: 25, halign: "right" }, // Nominal
    },

    alternateRowStyles: { fillColor: [250, 250, 252] },

    didParseCell: (data) => {
      if (data.section === "head") {
        if (data.column.index === 0) data.cell.styles.halign = "center";
        if (data.column.index === 5) data.cell.styles.halign = "center";
        if (data.column.index === 6) data.cell.styles.halign = "right";
      }

      if (data.section === "body") {
        const row = transaksi[data.row.index];
        if (!row) return;

        if (data.column.index === 0) {
          data.cell.styles.cellPadding = {
            top: 3.5,
            right: 1,
            bottom: 3.5,
            left: 1,
          };
        }

        if (data.column.index === 6) {
          if (row.tipe === "Pemasukan")
            data.cell.styles.textColor = COLORS.green;
          else if (row.tipe === "Pengeluaran")
            data.cell.styles.textColor = COLORS.red;
          else if (row.tipe === "Transfer")
            data.cell.styles.textColor = COLORS.blue;
          data.cell.styles.fontStyle = "bold";
        }

        if (data.column.index === 5) {
          if (row.tipe === "Pemasukan") {
            data.cell.styles.textColor = COLORS.green;
            data.cell.styles.fillColor = COLORS.greenLight;
          } else if (row.tipe === "Pengeluaran") {
            data.cell.styles.textColor = COLORS.red;
            data.cell.styles.fillColor = COLORS.redLight;
          } else if (row.tipe === "Transfer") {
            data.cell.styles.textColor = COLORS.blue;
            data.cell.styles.fillColor = COLORS.blueLight;
          } else if (row.tipe === "Koreksi Saldo") {
            data.cell.styles.textColor = COLORS.amber;
          }
        }
      }
    },

    willDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        data.cell.text = []; // Kosongkan text agar tidak digambar oleh autoTable (mencegah double text)
      }
    },

    didDrawCell: (data) => {
      // Gambar ulang teks "Judul & Kategori" secara custom
      if (data.section === "body" && data.column.index === 2) {
        const row = transaksi[data.row.index];
        const judul = row.judul;
        const kategori = row.kategori;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        const judulLines = doc.splitTextToSize(judul, data.cell.width - 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const kategoriLines = doc.splitTextToSize(
          kategori,
          data.cell.width - 6,
        );

        doc.setTextColor(...COLORS.black);
        doc.text(judulLines, data.cell.x + 3, data.cell.y + 3.5, {
          baseline: "top",
        });

        doc.setTextColor(...COLORS.gray);
        doc.text(
          kategoriLines,
          data.cell.x + 3,
          data.cell.y + 3.5 + judulLines.length * 3.0,
          { baseline: "top" },
        );
      }
    },
  });

  let yLast = doc.lastAutoTable.finalY + 10;
  if (yLast + 30 > pageH - 20) {
    doc.addPage();
    yLast = 20;
  }

  doc.setFillColor(...COLORS.grayLight);
  doc.roundedRect(margin, yLast, contentW, 22, 3, 3, "F");
  doc.setDrawColor(...COLORS.grayBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, yLast, contentW, 22, 3, 3, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.black);

  const boxY = yLast + 12;
  doc.text(`Total: ${transaksi.length} transaksi`, margin + 6, boxY);

  doc.setTextColor(...COLORS.green);
  doc.text(
    `Pemasukan: ${formatRupiah(summary.total_income)}`,
    margin + 45,
    boxY,
  );

  doc.setTextColor(...COLORS.red);
  doc.text(
    `Pengeluaran: ${formatRupiah(summary.total_expense)}`,
    margin + 90,
    boxY,
  );

  doc.setTextColor(...COLORS.indigo);
  doc.text(`Selisih: ${formatRupiah(summary.net)}`, pageW - margin - 6, boxY, {
    align: "right",
  });

  // Gambar header dan footer pada SETIAP halaman di tahap akhir
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeader();
    addPageFooter(i, totalPages);
  }

  const fileName = `catatz-laporan-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
