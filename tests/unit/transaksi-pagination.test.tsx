import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { TransaksiPagination } from "@/app/(dashboard)/transactions/_components/transaksi-pagination";

describe("TransaksiPagination Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders page info and item counters accurately", () => {
    render(
      <TransaksiPagination
        currentPage={1}
        totalPages={26}
        pageSize={50}
        totalItems={1284}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByText("1-50")).toBeInTheDocument();
    expect(screen.getByText("1.284")).toBeInTheDocument();
  });

  it("disables prev button on the first page", () => {
    const handlePageChange = vi.fn();
    render(
      <TransaksiPagination
        currentPage={1}
        totalPages={10}
        pageSize={50}
        totalItems={500}
        onPageChange={handlePageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    const prevButtons = screen.getAllByRole("button", { name: /halaman sebelumnya/i });
    expect(prevButtons[0]).toBeDisabled();
  });

  it("disables next button on the last page", () => {
    const handlePageChange = vi.fn();
    render(
      <TransaksiPagination
        currentPage={10}
        totalPages={10}
        pageSize={50}
        totalItems={500}
        onPageChange={handlePageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    const nextButtons = screen.getAllByRole("button", { name: /halaman berikutnya/i });
    expect(nextButtons[0]).toBeDisabled();
  });

  it("calls onPageChange when clicking Next button", async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();

    render(
      <TransaksiPagination
        currentPage={1}
        totalPages={5}
        pageSize={50}
        totalItems={250}
        onPageChange={handlePageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    const nextButtons = screen.getAllByRole("button", { name: /halaman berikutnya/i });
    await user.click(nextButtons[0]);

    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when clicking a specific page button", async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();

    render(
      <TransaksiPagination
        currentPage={1}
        totalPages={5}
        pageSize={50}
        totalItems={250}
        onPageChange={handlePageChange}
        onPageSizeChange={vi.fn()}
      />
    );

    const page3Btn = screen.getByRole("button", { name: "Halaman 3" });
    await user.click(page3Btn);

    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it("renders ellipsis for large page counts", () => {
    render(
      <TransaksiPagination
        currentPage={1}
        totalPages={20}
        pageSize={50}
        totalItems={1000}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByText("…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Halaman 20" })).toBeInTheDocument();
  });

  it("uses balanced h-9 control sizes with data-size='sm' on SelectTrigger and data-size='icon-sm' on page buttons", () => {
    render(
      <TransaksiPagination
        currentPage={2}
        totalPages={5}
        pageSize={50}
        totalItems={250}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    const rowsSelect = screen.getByRole("combobox", {
      name: /pilih jumlah baris per halaman/i,
    });
    expect(rowsSelect).toHaveAttribute("data-size", "sm");

    const activePageBtn = screen.getByRole("button", { name: "Halaman 2" });
    expect(activePageBtn).toHaveAttribute("aria-current", "page");
    expect(activePageBtn).toHaveAttribute("data-size", "icon-sm");

    const inactivePageBtn = screen.getByRole("button", { name: "Halaman 3" });
    expect(inactivePageBtn).not.toHaveAttribute("aria-current");
    expect(inactivePageBtn).toHaveAttribute("data-size", "icon-sm");
  });
});
