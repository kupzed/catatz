import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HutangCard } from "@/app/(dashboard)/debts/_components/hutang-card";
import type { Hutang } from "@/types/hutang";

// Mock useSystemPreferences
vi.mock("@providers/system-preference-provider", () => ({
  useSystemPreferences: () => ({
    formatRupiah: (val: number) => `Rp ${val.toLocaleString("id-ID")}`,
    formatTanggal: (d: string) => d,
    formatWaktu: (w: string) => w,
  }),
}));

describe("HutangCard component", () => {
  const dummyHutang: Hutang = {
    id: "h-123",
    user_id: "user-1",
    nama_entitas: "Budi Santoso",
    tipe: "memberi",
    total_pinjaman: 1000000,
    sisa_tagihan: 400000,
    tanggal_mulai: "2026-10-01",
    tanggal_jatuh_tempo: null,
    waktu: "10:00",
    rekening_id: null,
    status: "aktif",
    is_lunas_manual: false,
    catatan: "Teman kantor",
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-10-01T10:00:00Z",
    cicilan: [
      {
        id: "c-1",
        hutang_id: "h-123",
        nominal: 600000,
        tanggal: "2026-10-10",
        waktu: "12:00",
        tipe_hutang_snapshot: "memberi",
        jenis_transaksi: "pembayaran",
        rekening_id: null,
        catatan: null,
        created_at: "2026-10-10T12:00:00Z",
      },
    ],
  };

  it("merender nama pihak, catatan, dan link ke halaman detail", () => {
    render(
      <HutangCard
        hutang={dummyHutang}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Budi Santoso")).toBeDefined();
    expect(screen.getByText("Teman kantor")).toBeDefined();
    expect(screen.getByText("Belum Lunas")).toBeDefined();

    // Link ke detail
    const detailLinks = screen.getAllByRole("link");
    const hasDetailLink = detailLinks.some(
      (link) => link.getAttribute("href") === "/debts/h-123"
    );
    expect(hasDetailLink).toBe(true);
  });

  it("merender badge Lunas jika is_lunas_manual bernilai true", () => {
    const lunasHutang: Hutang = {
      ...dummyHutang,
      status: "lunas",
      is_lunas_manual: true,
    };

    render(
      <HutangCard
        hutang={lunasHutang}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("✓ Lunas")).toBeDefined();
  });
});
