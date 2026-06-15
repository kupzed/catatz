import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UpdatePrompt } from "@/components/pwa/update-prompt";

const pwaState = vi.hoisted(() => ({
  isUpdateAvailable: true,
  triggerUpdate: vi.fn(),
}));

vi.mock("@/components/pwa/sw-provider", () => ({
  usePWA: () => pwaState,
}));

describe("UpdatePrompt", () => {
  afterEach(cleanup);

  beforeEach(() => {
    pwaState.isUpdateAvailable = true;
    pwaState.triggerUpdate.mockClear();
  });

  it("keeps update controls below the device safe area", () => {
    render(<UpdatePrompt />);

    const prompt = screen.getByRole("status");

    expect(prompt).toHaveAttribute("data-slot", "pwa-update-prompt");
    expect(prompt.className).toContain("pt-[env(safe-area-inset-top)]");
    expect(
      screen.getByRole("button", { name: "Perbarui Sekarang" }),
    ).toBeVisible();
  });

  it("allows the prompt to be dismissed without triggering an update", () => {
    render(<UpdatePrompt />);

    fireEvent.click(screen.getByRole("button", { name: "Nanti" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(pwaState.triggerUpdate).not.toHaveBeenCalled();
  });
});
