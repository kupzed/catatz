import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import TransaksiDialog from "@/app/(dashboard)/transactions/_components/transaksi-dialog";
import { transaksiSchema } from "@/validations/transaksi-validation";
import type { Transaksi, Kategori } from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";

// Mock Server Actions
const mockCreateTransaksi = vi.fn();
const mockUpdateTransaksi = vi.fn();
const mockGetJudulSuggestions = vi.fn();
const mockGetRecentJudul = vi.fn();

vi.mock("@/actions/transaksi-action", () => ({
  createTransaksi: (...args: unknown[]) => mockCreateTransaksi(...args),
  updateTransaksi: (...args: unknown[]) => mockUpdateTransaksi(...args),
  getJudulSuggestions: (...args: unknown[]) => mockGetJudulSuggestions(...args),
  getRecentJudul: (...args: unknown[]) => mockGetRecentJudul(...args),
}));

// Mock Offline Queue
const mockAddToQueue = vi.fn();
vi.mock("@/lib/offline-queue", () => ({
  addToQueue: (...args: unknown[]) => mockAddToQueue(...args),
}));

// Mock Sonner Toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock dynamic AI component section
vi.mock(
  "@/app/(dashboard)/transactions/_components/transaksi-ai-section",
  () => ({
    TransaksiAiSection: ({
      voiceBusy,
      fileBusy,
      onVoiceBusyChange,
      onFileBusyChange,
      onParsedResult,
    }: {
      voiceBusy: boolean;
      fileBusy: boolean;
      onVoiceBusyChange: (busy: boolean) => void;
      onFileBusyChange: (busy: boolean) => void;
      onParsedResult: (result: unknown, source: "suara" | "file") => void;
    }) => (
      <div data-testid="transaksi-ai-section">
        <span>Input Otomatis (AI)</span>
        <button
          type="button"
          data-testid="voice-input-btn"
          disabled={fileBusy}
          onClick={() => {
            onVoiceBusyChange(false);
            onParsedResult(
              {
                transactions: [
                  {
                    tipe: "expense",
                    nominal: 60000,
                    tanggal: "2026-10-15",
                    waktu: "13:45",
                    kategori_hint: "",
                    rekening_hint: "",
                    rekening_tujuan_hint: "",
                    judul: "Nasi Goreng",
                    catatan: "Makan malam",
                    entitas: "",
                    confidence: 0.9,
                    needs_clarification: false,
                    clarification_fields: [],
                    flags: [],
                  },
                ],
                parse_summary: "Nasi Goreng 60rb",
              },
              "suara",
            );
          }}
        >
          Voice
        </button>
        <button
          type="button"
          data-testid="file-input-btn"
          disabled={voiceBusy}
          onClick={() => onFileBusyChange(true)}
        >
          File
        </button>
      </div>
    ),
  }),
);

const dummyRekening: Rekening[] = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    user_id: "u-1",
    nama: "BCA Rekening",
    jenis: "Bank",
    saldo_awal: 1000000,
    saldo_saat_ini: 1500000,
    warna: "#0052ff",
    logo: "bca",
    exclude_total: false,
    urutan: 1,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    user_id: "u-1",
    nama: "Dompet Tunai",
    jenis: "Tunai",
    saldo_awal: 500000,
    saldo_saat_ini: 300000,
    warna: "#05b169",
    logo: null,
    exclude_total: false,
    urutan: 2,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

const dummyKategori: Kategori[] = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    user_id: null,
    nama: "Makanan",
    ikon: "🍜",
    warna: "#cf202f",
    tipe: "expense",
    is_system: true,
    created_at: "2026-01-01",
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    user_id: null,
    nama: "Gaji",
    ikon: "💰",
    warna: "#05b169",
    tipe: "income",
    is_system: true,
    created_at: "2026-01-01",
  },
  {
    id: "b0000000-0000-4000-8000-000000000003",
    user_id: null,
    nama: "Umum",
    ikon: "📦",
    warna: "#0052ff",
    tipe: "all",
    is_system: true,
    created_at: "2026-01-01",
  },
];

function createDummyTransaksi(overrides: Partial<Transaksi> = {}): Transaksi {
  return {
    id: "tx-default",
    user_id: "u-1",
    rekening_id: "a0000000-0000-4000-8000-000000000001",
    kategori_id: "b0000000-0000-4000-8000-000000000001",
    nominal: 50000,
    tipe: "expense",
    tanggal: "2026-10-10",
    waktu: "12:00:00",
    judul: "Makan",
    catatan: "",
    rekening_tujuan: null,
    tags: [],
    is_recurring: false,
    recurring_id: null,
    created_at: "2026-10-10T12:00:00Z",
    updated_at: "2026-10-10T12:00:00Z",
    ...overrides,
  };
}

describe("TransaksiDialog", () => {
  const onOpenChange = vi.fn();
  const onCreated = vi.fn();
  const onUpdated = vi.fn();
  const onQueued = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecentJudul.mockResolvedValue([]);
    mockGetJudulSuggestions.mockResolvedValue([]);
    mockCreateTransaksi.mockResolvedValue({
      success: true,
      data: { id: "new-tx-id", nominal: 50000 },
    });
    mockUpdateTransaksi.mockResolvedValue({
      success: true,
      data: { id: "edit-tx-id", nominal: 75000 },
    });
  });

  it("renders Create mode with AI section, tabs, and Simpan button", () => {
    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    expect(screen.getByText("Tambah Transaksi")).toBeInTheDocument();
    expect(
      screen.getByText("Catat pengeluaran, pemasukan, atau transfer baru."),
    ).toBeInTheDocument();

    // AI section
    expect(screen.getByTestId("transaksi-ai-section")).toBeInTheDocument();
    expect(screen.getByTestId("voice-input-btn")).toBeInTheDocument();
    expect(screen.getByTestId("file-input-btn")).toBeInTheDocument();

    // Fields
    expect(screen.getByLabelText("Tanggal")).toBeInTheDocument();
    expect(screen.getByLabelText("Waktu")).toBeInTheDocument();
    expect(screen.getByLabelText("Nominal (Rp)")).toBeInTheDocument();
    expect(screen.getByLabelText("Judul")).toBeInTheDocument();
    expect(screen.getByLabelText("Catatan")).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Batal" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("renders Edit mode with prefilled data, hidden AI section, and Copy button", () => {
    const editData = createDummyTransaksi({
      id: "tx-123",
      judul: "Makan Siang",
      catatan: "Di warung padang",
      nominal: 45000,
      tanggal: "2026-10-10",
      waktu: "14:30:00",
    });

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        editData={editData}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    expect(screen.getByText("Edit Transaksi")).toBeInTheDocument();
    expect(
      screen.getByText("Perbarui rincian transaksi Anda."),
    ).toBeInTheDocument();

    // AI section should be hidden in Edit mode
    expect(screen.queryByTestId("transaksi-ai-section")).not.toBeInTheDocument();

    // Field values
    expect(screen.getByLabelText("Tanggal")).toHaveValue("2026-10-10");
    expect(screen.getByLabelText("Waktu")).toHaveValue("14:30");
    expect(screen.getByLabelText("Judul")).toHaveValue("Makan Siang");
    expect(screen.getByLabelText("Catatan")).toHaveValue("Di warung padang");

    // Copy and Perbarui buttons
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Perbarui" })).toBeInTheDocument();
  });

  it("submits update successfully in Edit mode", async () => {
    const editData = createDummyTransaksi({
      id: "tx-edit-submit",
      nominal: 75000,
      judul: "Buku Tulis",
      tanggal: "2026-10-11",
      waktu: "15:00:00",
    });

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        editData={editData}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Perbarui" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateTransaksi).toHaveBeenCalledWith(
        "tx-edit-submit",
        expect.objectContaining({
          nominal: 75000,
          judul: "Buku Tulis",
        }),
      );
      expect(onUpdated).toHaveBeenCalledWith({ id: "edit-tx-id", nominal: 75000 });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("renders Copy mode with copyFrom data, hidden AI section, and reset date", () => {
    const copyFromData = createDummyTransaksi({
      id: "tx-original",
      nominal: 120000,
      tanggal: "2026-09-01",
      waktu: "10:00:00",
      judul: "Beli Buku",
      catatan: "Toko buku",
    });

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        copyFrom={copyFromData}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    expect(screen.getByText("Copy Transaksi")).toBeInTheDocument();
    expect(
      screen.getByText("Membuat transaksi baru dengan data yang sama."),
    ).toBeInTheDocument();

    // AI section should be hidden in Copy mode
    expect(screen.queryByTestId("transaksi-ai-section")).not.toBeInTheDocument();

    // Judul & Catatan should be copied
    expect(screen.getByLabelText("Judul")).toHaveValue("Beli Buku");
    expect(screen.getByLabelText("Catatan")).toHaveValue("Toko buku");

    // Submit button should be Simpan
    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("renders Correction mode with locked type, readonly account info, and hidden Judul/Kategori", () => {
    const correctionData = createDummyTransaksi({
      id: "tx-corr",
      kategori_id: null,
      nominal: 50000,
      tipe: "correction",
      tanggal: "2026-10-14",
      waktu: "09:00:00",
      judul: null,
      catatan: "Penyesuaian saldo fisik",
    });

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        editData={correctionData}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    expect(screen.getByText("Edit Koreksi Saldo")).toBeInTheDocument();
    expect(
      screen.getByText("Perbarui catatan koreksi saldo rekening."),
    ).toBeInTheDocument();

    // Correction badge and warning
    expect(screen.getByText("Koreksi Saldo")).toBeInTheDocument();
    expect(screen.getByText("Tipe tidak dapat diubah")).toBeInTheDocument();

    // Readonly rekening row
    expect(screen.getByText("BCA Rekening")).toBeInTheDocument();
    expect(screen.getByText("(Bank)")).toBeInTheDocument();

    // Judul and Kategori should be hidden
    expect(screen.queryByLabelText("Judul")).not.toBeInTheDocument();
    expect(screen.queryByText("Pilih kategori")).not.toBeInTheDocument();

    // Copy button should NOT be available in correction mode
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("switches to Transfer tab: displays Rekening Tujuan and hides Judul/Kategori", async () => {
    const user = userEvent.setup();

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    // Initial state: Pengeluaran tab active
    expect(screen.getByLabelText("Judul")).toBeInTheDocument();
    expect(screen.queryByText("Rekening Tujuan")).not.toBeInTheDocument();

    // Click Transfer tab using regex for emoji
    const transferTab = screen.getByRole("tab", { name: /Transfer/ });
    await user.click(transferTab);

    // Transfer state: Rekening Tujuan visible, Judul and Kategori hidden
    expect(screen.getByText("Rekening Tujuan")).toBeInTheDocument();
    expect(screen.queryByLabelText("Judul")).not.toBeInTheDocument();
  });

  it("handles copy button click and triggers signal to parent", async () => {
    vi.useFakeTimers();

    const editData = createDummyTransaksi({
      id: "tx-copy-source",
      nominal: 30000,
      tanggal: "2026-10-12",
      waktu: "11:00:00",
      judul: "Kopi",
    });

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        editData={editData}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    const copyBtn = screen.getByRole("button", { name: "Copy" });
    fireEvent.click(copyBtn);

    // Advance fake timer for animation delay
    vi.advanceTimersByTime(250);

    expect(onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tx-copy-source",
        _isCopySignal: true,
      }),
    );

    vi.useRealTimers();
  });

  it("queues transaction when offline during submit", async () => {
    mockAddToQueue.mockResolvedValue({ id: "offline-action-1" });

    // Mock navigator.onLine = false
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        editData={createDummyTransaksi({
          id: "tx-offline",
          nominal: 20000,
          tanggal: "2026-10-14",
          waktu: "12:00:00",
          judul: "Offline expense",
        })}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Perbarui" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "UPDATE_TRANSAKSI",
        }),
      );
      expect(onQueued).toHaveBeenCalledWith({ id: "offline-action-1" });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    // Restore navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: originalOnLine,
    });
  });

  it("renders suggestions and allows selecting a suggestion", async () => {
    mockGetRecentJudul.mockResolvedValue([
      { judul: "Bensin Shell", kategori_id: "b0000000-0000-4000-8000-000000000001" },
    ]);

    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Bensin Shell")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Bensin Shell"));

    await waitFor(() => {
      expect(screen.getByLabelText("Judul")).toHaveValue("Bensin Shell");
    });
  });

  it("handles AI autofill parsed result properly", async () => {
    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    const voiceBtn = screen.getByTestId("voice-input-btn");
    fireEvent.click(voiceBtn);

    await waitFor(() => {
      expect(screen.getByLabelText("Judul")).toHaveValue("Nasi Goreng");
      expect(screen.getByLabelText("Tanggal")).toHaveValue("2026-10-15");
      expect(screen.getByLabelText("Waktu")).toHaveValue("13:45");
      expect(screen.getByLabelText("Catatan")).toHaveValue("Makan malam");
    });
  });

  it("displays validation error when required fields are missing on submit", async () => {
    render(
      <TransaksiDialog
        open={true}
        onOpenChange={onOpenChange}
        rekening={dummyRekening}
        kategori={dummyKategori}
        onCreated={onCreated}
        onUpdated={onUpdated}
        onQueued={onQueued}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Simpan" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Nominal harus berupa angka")).toBeInTheDocument();
      expect(mockCreateTransaksi).not.toHaveBeenCalled();
    });
  });

  describe("transfer and correction category clearing", () => {
    it("validates that transfer cannot have kategori_id in schema", () => {
      const invalidTransfer = {
        tipe: "transfer" as const,
        nominal: 50000,
        tanggal: "2026-10-14",
        rekening_id: "a0000000-0000-4000-8000-000000000001",
        rekening_tujuan: "a0000000-0000-4000-8000-000000000002",
        kategori_id: "b0000000-0000-4000-8000-000000000001",
      };

      const result = transaksiSchema.safeParse(invalidTransfer);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("kategori_id");
      }
    });

    it("validates that correction cannot have kategori_id in schema", () => {
      const invalidCorrection = {
        tipe: "correction" as const,
        nominal: 20000,
        tanggal: "2026-10-14",
        rekening_id: "a0000000-0000-4000-8000-000000000001",
        kategori_id: "b0000000-0000-4000-8000-000000000001",
      };

      const result = transaksiSchema.safeParse(invalidCorrection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("kategori_id");
      }
    });

    it("accepts valid transfer when kategori_id and judul are omitted", () => {
      const validTransfer = {
        tipe: "transfer" as const,
        nominal: 50000,
        tanggal: "2026-10-14",
        rekening_id: "a0000000-0000-4000-8000-000000000001",
        rekening_tujuan: "a0000000-0000-4000-8000-000000000002",
      };

      const result = transaksiSchema.safeParse(validTransfer);
      expect(result.success).toBe(true);
    });
  });

  describe("lockKategori mode in category detail", () => {
    it("disables category select and filters recent judul by category on create", async () => {
      render(
        <TransaksiDialog
          open={true}
          onOpenChange={onOpenChange}
          rekening={dummyRekening}
          kategori={dummyKategori}
          defaultKategoriId="b0000000-0000-4000-8000-000000000001"
          lockKategori={true}
          onCreated={onCreated}
          onUpdated={onUpdated}
          onQueued={onQueued}
        />,
      );

      // getRecentJudul should be called with defaultKategoriId
      expect(mockGetRecentJudul).toHaveBeenCalledWith(
        "b0000000-0000-4000-8000-000000000001",
      );

      // Category trigger should be disabled
      const kategoriTrigger = document.getElementById("kategori-select");
      expect(kategoriTrigger).toBeInTheDocument();
      expect(kategoriTrigger).toBeDisabled();
      expect(screen.getByText("Terkunci di kategori ini")).toBeInTheDocument();

      // Only 'Keluar' tab exists since category is expense-only
      expect(screen.getByRole("tab", { name: /Keluar/i })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /Masuk/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /Transfer/i })).not.toBeInTheDocument();
    });

    it("renders expense and income tabs for all-type category, excluding transfer", () => {
      render(
        <TransaksiDialog
          open={true}
          onOpenChange={onOpenChange}
          rekening={dummyRekening}
          kategori={dummyKategori}
          defaultKategoriId="b0000000-0000-4000-8000-000000000003"
          lockKategori={true}
          onCreated={onCreated}
          onUpdated={onUpdated}
          onQueued={onQueued}
        />,
      );

      expect(screen.getByRole("tab", { name: /Keluar/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Masuk/i })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /Transfer/i })).not.toBeInTheDocument();
    });

    it("locks category in edit mode and forces submit with category id", async () => {
      const tx = createDummyTransaksi({
        id: "tx-edit-cat",
        kategori_id: "b0000000-0000-4000-8000-000000000001",
        nominal: 25000,
        judul: "Bakso",
        rekening_id: dummyRekening[0].id,
      });

      render(
        <TransaksiDialog
          open={true}
          onOpenChange={onOpenChange}
          rekening={dummyRekening}
          kategori={dummyKategori}
          editData={tx}
          defaultKategoriId="b0000000-0000-4000-8000-000000000001"
          lockKategori={true}
          onCreated={onCreated}
          onUpdated={onUpdated}
          onQueued={onQueued}
        />,
      );

      const kategoriTrigger = document.getElementById("kategori-select");
      expect(kategoriTrigger).toBeDisabled();

      const submitBtn = screen.getByRole("button", {
        name: "Perbarui",
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockUpdateTransaksi).toHaveBeenCalledWith(
          "tx-edit-cat",
          expect.objectContaining({
            kategori_id: "b0000000-0000-4000-8000-000000000001",
          }),
        );
      });
    });

    it("fetches debounced suggestions filtered by category when typing judul", async () => {
      mockGetJudulSuggestions.mockResolvedValue([
        { judul: "Ayam Geprek", kategori_id: "b0000000-0000-4000-8000-000000000001" },
      ]);

      render(
        <TransaksiDialog
          open={true}
          onOpenChange={onOpenChange}
          rekening={dummyRekening}
          kategori={dummyKategori}
          defaultKategoriId="b0000000-0000-4000-8000-000000000001"
          lockKategori={true}
          onCreated={onCreated}
          onUpdated={onUpdated}
          onQueued={onQueued}
        />,
      );

      const judulInput = screen.getByPlaceholderText(/Nama transaksi/i);
      fireEvent.change(judulInput, { target: { value: "Ayam" } });

      await waitFor(
        () => {
          expect(mockGetJudulSuggestions).toHaveBeenCalledWith(
            "Ayam",
            "b0000000-0000-4000-8000-000000000001",
          );
        },
        { timeout: 1000 },
      );
    });

    it("does not change locked category when user selects a suggestion", async () => {
      mockGetRecentJudul.mockResolvedValue([
        { judul: "Sate Ayam", kategori_id: "b0000000-0000-4000-8000-000000000002" },
      ]);

      render(
        <TransaksiDialog
          open={true}
          onOpenChange={onOpenChange}
          rekening={dummyRekening}
          kategori={dummyKategori}
          defaultRekeningId={dummyRekening[0].id}
          defaultKategoriId="b0000000-0000-4000-8000-000000000001"
          lockKategori={true}
          onCreated={onCreated}
          onUpdated={onUpdated}
          onQueued={onQueued}
        />,
      );

      // Wait for suggestion badge
      const suggestionBadge = await screen.findByRole("button", {
        name: /Sate Ayam/i,
      });
      fireEvent.click(suggestionBadge);

      // Judul is updated
      const judulInput = screen.getByPlaceholderText(/Nama transaksi/i) as HTMLInputElement;
      expect(judulInput.value).toBe("Sate Ayam");

      // Fill nominal and submit
      const nominalInput = screen.getByLabelText(/Nominal \(Rp\)/i);
      fireEvent.change(nominalInput, { target: { value: "35000" } });

      const submitBtn = screen.getByRole("button", { name: /^simpan$/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateTransaksi).toHaveBeenCalledWith(
          expect.objectContaining({
            judul: "Sate Ayam",
            kategori_id: "b0000000-0000-4000-8000-000000000001",
          }),
        );
      });
    });
  });
});

