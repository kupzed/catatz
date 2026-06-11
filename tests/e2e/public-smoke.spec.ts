import { expect, test } from "@playwright/test";

test("login page renders without production services", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "Selamat datang kembali" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Lupa password?" })).toHaveAttribute(
    "href",
    "/forgot-password",
  );
  await expect(page.getByRole("link", { name: "Daftar sekarang" })).toHaveAttribute(
    "href",
    "/register",
  );
});
