import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RekapPageClient from "@/app/(dashboard)/reports/_components/rekap-page-client";
import { RekapSettingsDialog } from "@/app/(dashboard)/reports/_components/rekap-settings-dialog";
import { RekapRealtimeTab } from "@/app/(dashboard)/reports/_components/rekap-realtime-tab";
import { RekapDonutChart } from "@/app/(dashboard)/reports/_components/rekap-charts";
import * as rekapPeriodActions from "@/actions/rekap-period-action";
import * as rekapActions from "@/actions/rekap-action";
import type { RekapSettings } from "@/types/rekap";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParamTab: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  usePathname: () => "/reports",
  useSearchParams: () => ({
    get: (key: string) => (key === "tab" ? mockSearchParamTab : null),
    toString: () => (mockSearchParamTab ? `tab=${mockSearchParamTab}` : ""),
  }),
}));

vi.mock("@/actions/rekap-period-action", () => ({
  updateRekapSettings: vi.fn(),
  listCustomPeriods: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/actions/rekap-action", () => ({
  getRekapDetailByRange: vi.fn().mockResolvedValue({
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    daysInPeriod: 30,
    daysInMonth: 30,
    total_income: 0,
    total_expense: 0,
    net: 0,
    rata_income_harian: 0,
    rata_expense_harian: 0,
    kategori: {
      income: [],
      expense: [],
    },
    judul: {
      income: [],
      expense: [],
    },
    koreksi: {
      total_tambah: 0,
      total_kurang: 0,
      net: 0,
      count: 0,
      items: [],
    },
    hutang_piutang: {
      piutang_baru: 0,
      hutang_baru: 0,
      cicilan_piutang: 0,
      cicilan_hutang: 0,
      piutang_aktif: 0,
      hutang_aktif: 0,
      count: 0,
      items: [],
    },
  }),
  getRekapRingkasanPeriodeList: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/actions/rekap-saldo-action", () => ({
  getSaldoPeriodeList: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

describe("RekapPageClient & RekapSettingsDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSearchParamTab = null;
  });

  it("renders page header with title and 44px settings button", () => {
    render(<RekapPageClient />);

    expect(screen.getByRole("heading", { name: "Rekap Keuangan" })).toBeInTheDocument();

    const settingsButton = screen.getByRole("button", { name: "Pengaturan Rekap" });
    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton.className).toContain("size-11");
    expect(settingsButton.className).toContain("rounded-full");
  });

  it("renders tabs Realtime, Bulanan, and Custom, defaulting to Realtime", () => {
    render(<RekapPageClient />);

    expect(screen.getByRole("tab", { name: "Realtime" })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("tab", { name: "Bulanan" })).toHaveAttribute("data-state", "inactive");
    expect(screen.getByRole("tab", { name: "Custom" })).toHaveAttribute("data-state", "inactive");

    expect(screen.getByText("Siklus Berjalan")).toBeInTheDocument();
  });

  it("navigates tabs and replaces URL with scroll: false", () => {
    render(<RekapPageClient />);

    const bulananTab = screen.getByRole("tab", { name: "Bulanan" });
    fireEvent.mouseDown(bulananTab, { button: 0 });
    fireEvent.click(bulananTab);

    expect(mockReplace).toHaveBeenCalledWith("/reports?tab=bulanan", { scroll: false });
  });

  it("respects tab from query params", async () => {
    mockSearchParamTab = "custom";
    render(<RekapPageClient />);

    expect(screen.getByRole("tab", { name: "Custom" })).toHaveAttribute("data-state", "active");
    await waitFor(() => {
      expect(screen.getByText("Belum Ada Periode Kustom")).toBeInTheDocument();
    });
  });

  it("opens rekap settings dialog when settings button is clicked", () => {
    render(<RekapPageClient />);

    const settingsButton = screen.getByRole("button", { name: "Pengaturan Rekap" });
    fireEvent.click(settingsButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pengaturan Rekap" })).toBeInTheDocument();
    expect(screen.getByText(/Pratinjau Siklus Berjalan/i)).toBeInTheDocument();
  });

  it("saves rekap settings via updateRekapSettings with optimistic update", async () => {
    const initialSettings: RekapSettings = {
      cutoff_day: 1,
      akumulasi_saldo: false,
    };

    const updateMock = vi.mocked(rekapPeriodActions.updateRekapSettings).mockResolvedValue({
      success: true,
      data: {
        id: "test-id",
        user_id: "user-1",
        cutoff_day: 1,
        akumulasi_saldo: true,
      },
    });

    const onSettingsSaved = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <RekapSettingsDialog
        open={true}
        onOpenChange={onOpenChange}
        settings={initialSettings}
        onSettingsSaved={onSettingsSaved}
      />,
    );

    // Toggle switch akumulasi
    const switchEl = screen.getByRole("switch", { name: "Saldo Akumulasi" });
    fireEvent.click(switchEl);

    // Click Simpan
    const simpanBtn = screen.getByRole("button", { name: "Simpan" });
    fireEvent.click(simpanBtn);

    // Optimistic update call
    expect(onSettingsSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        cutoff_day: 1,
        akumulasi_saldo: true,
      }),
    );

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({
        cutoff_day: 1,
        akumulasi_saldo: true,
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("rolls back optimistic state if updateRekapSettings fails", async () => {
    const initialSettings: RekapSettings = {
      cutoff_day: 5,
      akumulasi_saldo: false,
    };

    vi.mocked(rekapPeriodActions.updateRekapSettings).mockResolvedValue({
      success: false,
      error: "Gagal menyimpan ke server",
    });

    const onSettingsSaved = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <RekapSettingsDialog
        open={true}
        onOpenChange={onOpenChange}
        settings={initialSettings}
        onSettingsSaved={onSettingsSaved}
      />,
    );

    const switchEl = screen.getByRole("switch", { name: "Saldo Akumulasi" });
    fireEvent.click(switchEl);

    const simpanBtn = screen.getByRole("button", { name: "Simpan" });
    fireEvent.click(simpanBtn);

    await waitFor(() => {
      // First optimistic, then rollback
      expect(onSettingsSaved).toHaveBeenLastCalledWith(initialSettings);
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it("renders RekapRealtimeTab with categories, proportion bars, and donut chart", async () => {
    vi.mocked(rekapActions.getRekapDetailByRange).mockResolvedValueOnce({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      daysInPeriod: 30,
      daysInMonth: 30,
      total_income: 1000000,
      total_expense: 500000,
      net: 500000,
      rata_income_harian: 33333,
      rata_expense_harian: 16667,
      kategori: {
        income: [],
        expense: [
          {
            id: "kat-1",
            tipe: "expense",
            label: "Makanan & Minuman",
            icon: "🍔",
            color: "#0052ff",
            total: 350000,
            count: 5,
            persentase: 70,
            transaksi: [],
          },
          {
            id: "kat-2",
            tipe: "expense",
            label: "Transportasi",
            icon: "🚗",
            color: "#05b169",
            total: 150000,
            count: 2,
            persentase: 30,
            transaksi: [],
          },
        ],
      },
      judul: { income: [], expense: [] },
      koreksi: { total_tambah: 0, total_kurang: 0, net: 0, count: 0, items: [] },
      hutang_piutang: {
        piutang_baru: 0,
        hutang_baru: 0,
        cicilan_piutang: 0,
        cicilan_hutang: 0,
        piutang_aktif: 0,
        hutang_aktif: 0,
        count: 0,
        items: [],
      },
    });

    render(<RekapRealtimeTab settings={{ cutoff_day: 1, akumulasi_saldo: false }} />);

    await waitFor(() => {
      expect(screen.getByText("Makanan & Minuman")).toBeInTheDocument();
      expect(screen.getByText("Transportasi")).toBeInTheDocument();
      expect(screen.getByText("70%")).toBeInTheDocument();
      expect(screen.getByText("30%")).toBeInTheDocument();
      expect(screen.getByText("Rincian Kategori (2)")).toBeInTheDocument();
    });
  });

  it("renders RekapDonutChart with center total and labels", () => {
    render(
      <RekapDonutChart
        data={[
          { id: "1", label: "Makan", total: 100000, color: "#0052ff" },
          { id: "2", label: "Bensin", total: 50000, color: "#05b169" },
        ]}
        totalExpense={150000}
      />,
    );

    expect(screen.getByText("Total Pengeluaran")).toBeInTheDocument();
    expect(screen.getByText("Rp 150.000")).toBeInTheDocument();
  });

  it("switches RekapRealtimeTab to Judul and displays titles with receipt icon and count badge", async () => {
    vi.mocked(rekapActions.getRekapDetailByRange).mockResolvedValueOnce({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      daysInPeriod: 30,
      daysInMonth: 30,
      total_income: 1000000,
      total_expense: 500000,
      net: 500000,
      rata_income_harian: 33333,
      rata_expense_harian: 16667,
      kategori: {
        income: [],
        expense: [
          {
            id: "kat-1",
            tipe: "expense",
            label: "Makanan & Minuman",
            icon: "🍔",
            color: "#0052ff",
            total: 500000,
            count: 2,
            persentase: 100,
            transaksi: [],
          },
        ],
      },
      judul: {
        income: [],
        expense: [
          {
            id: "jud-1",
            tipe: "expense",
            label: "Makan Siang Resto",
            icon: "",
            color: "#0052ff",
            total: 500000,
            count: 2,
            persentase: 100,
            transaksi: [],
          },
        ],
      },
      koreksi: { total_tambah: 0, total_kurang: 0, net: 0, count: 0, items: [] },
      hutang_piutang: {
        piutang_baru: 0,
        hutang_baru: 0,
        cicilan_piutang: 0,
        cicilan_hutang: 0,
        piutang_aktif: 0,
        hutang_aktif: 0,
        count: 0,
        items: [],
      },
    });

    render(<RekapRealtimeTab settings={{ cutoff_day: 1, akumulasi_saldo: false }} />);

    await waitFor(() => {
      expect(screen.getByText("Makanan & Minuman")).toBeInTheDocument();
    });

    const judulTab = screen.getByRole("tab", { name: "Judul" });
    fireEvent.mouseDown(judulTab, { button: 0 });
    fireEvent.click(judulTab);

    expect(screen.getByText("Rincian Judul (1)")).toBeInTheDocument();
    expect(screen.getByText("Makan Siang Resto")).toBeInTheDocument();
    expect(screen.getByText("1 judul")).toBeInTheDocument();
  });
});
