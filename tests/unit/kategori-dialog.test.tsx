import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KategoriDialog from "@/app/(dashboard)/categories/_components/kategori-dialog";
import type { Kategori } from "@/types/transaksi";

const mockCreateKategori = vi.fn();
const mockUpdateKategori = vi.fn();

vi.mock("@/actions/kategori-action", () => ({
  createKategori: (...args: unknown[]) => mockCreateKategori(...args),
  updateKategori: (...args: unknown[]) => mockUpdateKategori(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { toast } from "sonner";

describe("KategoriDialog component", () => {
  const dummyKategori: Kategori = {
    id: "kat-1",
    user_id: "user-1",
    nama: "Makan & Minum",
    ikon: "🍔",
    warna: "#ef4444",
    tipe: "expense",
    is_system: false,
    created_at: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("menutup dialog dan memanggil onCreated saat create kategori berhasil", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    const handleCreated = vi.fn();

    const createdData: Kategori = {
      id: "kat-new",
      user_id: "user-1",
      nama: "Kopi Harian",
      ikon: "💰",
      warna: "#6366f1",
      tipe: "expense",
      is_system: false,
      created_at: "2026-01-02T00:00:00Z",
    };

    mockCreateKategori.mockResolvedValueOnce({
      success: true,
      data: createdData,
    });

    render(
      <KategoriDialog
        open={true}
        onOpenChange={handleOpenChange}
        onCreated={handleCreated}
      />
    );

    expect(screen.getByText("Tambah Kategori")).toBeInTheDocument();

    const inputNama = screen.getByPlaceholderText("Contoh: Makan Siang");
    await user.type(inputNama, "Kopi Harian");

    const submitBtn = screen.getByRole("button", { name: "Tambah" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateKategori).toHaveBeenCalledWith({
        nama: "Kopi Harian",
        ikon: "💰",
        warna: "#6366f1",
        tipe: "expense",
      });
      expect(toast.success).toHaveBeenCalledWith("Kategori ditambahkan");
      expect(handleCreated).toHaveBeenCalledWith(createdData);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("menutup dialog dan memanggil onUpdated saat edit kategori berhasil", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    const handleUpdated = vi.fn();

    const updatedData: Kategori = {
      ...dummyKategori,
      nama: "Kuliner & Jajan",
    };

    mockUpdateKategori.mockResolvedValueOnce({
      success: true,
      data: updatedData,
    });

    render(
      <KategoriDialog
        open={true}
        onOpenChange={handleOpenChange}
        editData={dummyKategori}
        onUpdated={handleUpdated}
      />
    );

    expect(screen.getByText("Edit Kategori")).toBeInTheDocument();

    const inputNama = screen.getByPlaceholderText("Contoh: Makan Siang");
    expect(inputNama).toHaveValue("Makan & Minum");

    await user.clear(inputNama);
    await user.type(inputNama, "Kuliner & Jajan");

    const submitBtn = screen.getByRole("button", { name: "Perbarui" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateKategori).toHaveBeenCalledWith(dummyKategori.id, {
        nama: "Kuliner & Jajan",
        ikon: "🍔",
        warna: "#ef4444",
        tipe: "expense",
      });
      expect(toast.success).toHaveBeenCalledWith("Kategori diperbarui");
      expect(handleUpdated).toHaveBeenCalledWith(updatedData);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("tidak menutup dialog jika createKategori gagal", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    mockCreateKategori.mockResolvedValueOnce({
      success: false,
      error: "Gagal menambahkan kategori",
    });

    render(
      <KategoriDialog
        open={true}
        onOpenChange={handleOpenChange}
      />
    );

    const inputNama = screen.getByPlaceholderText("Contoh: Makan Siang");
    await user.type(inputNama, "Tes Gagal");

    const submitBtn = screen.getByRole("button", { name: "Tambah" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateKategori).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Gagal menambahkan kategori");
      expect(handleOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it("tidak menutup dialog jika updateKategori gagal", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    mockUpdateKategori.mockResolvedValueOnce({
      success: false,
      error: "Gagal memperbarui kategori",
    });

    render(
      <KategoriDialog
        open={true}
        onOpenChange={handleOpenChange}
        editData={dummyKategori}
      />
    );

    const submitBtn = screen.getByRole("button", { name: "Perbarui" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateKategori).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Gagal memperbarui kategori");
      expect(handleOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it("memanggil onOpenChange(false) saat tombol Batal diklik", async () => {
    const handleOpenChange = vi.fn();

    render(
      <KategoriDialog
        open={true}
        onOpenChange={handleOpenChange}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "Batal" });
    fireEvent.click(cancelBtn);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
