import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import idDict from "@/i18n/dictionaries/id";
import enDict from "@/i18n/dictionaries/en";

describe("PWA Manifest & Static Assets Localization (Fase 20)", () => {
  it("verifies public/manifest.json is valid and uses English defaults", () => {
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe("CatatZ — Personal Finance Tracker");
    expect(manifest.short_name).toBe("CatatZ");
    expect(manifest.description).toBe("Fast and smart personal finance tracking");
    expect(manifest.lang).toBe("en");

    expect(manifest.shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Add Transaction", url: "/transactions?new=true" }),
        expect.objectContaining({ name: "Reports", url: "/reports" }),
        expect.objectContaining({ name: "Wallets", url: "/wallets" }),
      ]),
    );
  });

  it("verifies public/offline.html is localized in English", () => {
    const offlinePath = path.resolve(process.cwd(), "public/offline.html");
    const html = fs.readFileSync(offlinePath, "utf-8");

    expect(html).toContain('<html lang="en">');
    expect(html).toContain("No internet connection");
    expect(html).toContain("CatatZ is offline");
    expect(html).toContain("Try Again");
    expect(html).toContain("Pages available offline");
    expect(html).toContain('<a href="/transactions">Transactions</a>');
    expect(html).toContain('<a href="/wallets">Wallets</a>');
    expect(html).toContain('<a href="/reports">Reports</a>');
    expect(html).toContain('<a href="/debts">Debts</a>');
    expect(html).toContain('<a href="/categories">Categories</a>');
    expect(html).toContain('<a href="/settings">Settings</a>');
  });

  it("verifies localized metadata in id and en dictionaries", () => {
    expect(idDict.metadata.title).toBe("CatatZ — Pencatatan Keuangan Pribadi");
    expect(idDict.metadata.description).toContain("keuangan pribadi");
    expect(idDict.metadata.keywords).toContain("budgeting");

    expect(enDict.metadata.title).toBe("CatatZ — Personal Finance Tracker");
    expect(enDict.metadata.description).toContain("personal finance");
    expect(enDict.metadata.keywords).toContain("expense tracker");

    expect(idDict.pwa.offlineIndicator).toBe(
      "Tidak ada koneksi internet. Data baru membutuhkan koneksi.",
    );
    expect(enDict.pwa.offlineIndicator).toBe(
      "No internet connection. New data requires connection.",
    );

    expect(idDict.pwa.install.dismissButton).toBe("Nanti");
    expect(enDict.pwa.install.dismissButton).toBe("Later");

    expect(idDict.pwa.iosGuide.title).toBe("Tambahkan ke Layar Utama");
    expect(enDict.pwa.iosGuide.title).toBe("Add to Home Screen");
  });
});

