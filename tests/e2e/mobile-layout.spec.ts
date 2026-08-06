import { expect, test, type Locator, type Page } from "@playwright/test";

const mobileViewport = { width: 390, height: 844 };
const narrowViewport = { width: 320, height: 844 };
const fixtureDebtId = "00000000-0000-4000-8000-000000000040";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("mobile@catatz.test");
  await page.getByLabel("Password").fill("mobile-test-password");
  await Promise.all([
    page.waitForResponse((candidate) => candidate.request().method() === "POST"),
    page.getByRole("button", { name: "Masuk", exact: true }).click(),
  ]);
  await expect(page).toHaveURL(/\/transaksi$/);
}

async function expectInsideViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();

  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
}

test.describe("mobile dashboard layout", () => {
  test.use({ viewport: mobileViewport, colorScheme: "dark" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("keeps transaction controls and dialog actions inside the viewport", async ({
    page,
  }) => {
    const accountFilter = page.locator("#filter-rekening");
    await expect(accountFilter).toBeVisible();
    await expectInsideViewport(page, accountFilter);
    await expect(accountFilter).toHaveCSS("height", "48px");

    await page.getByRole("button", { name: "Transaksi Baru" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectInsideViewport(page, dialog);

    const voiceButton = page.getByRole("button", { name: "Voice Input" });
    const autoFillButton = page.getByRole("button", {
      name: "Pilih file untuk Auto Fill transaksi",
    });
    const [voiceBox, autoFillBox] = await Promise.all([
      voiceButton.boundingBox(),
      autoFillButton.boundingBox(),
    ]);

    expect(voiceBox).not.toBeNull();
    expect(autoFillBox).not.toBeNull();
    expect(Math.abs(voiceBox!.y - autoFillBox!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(voiceBox!.width - autoFillBox!.width)).toBeLessThanOrEqual(
      1,
    );

    await page.getByRole("button", { name: "Close" }).click();
    await page.locator("#filter-periode").click();
    await page.getByRole("option", { name: "Semua Waktu" }).click();

    const editTransactionButton = page.getByRole("button", {
      name: "Edit transaksi TopUp Games",
    });
    await expect(editTransactionButton).toBeVisible();
    await editTransactionButton.click();

    const footerButtons = ["Copy", "Batal", "Perbarui"].map((name) =>
      page.getByRole("button", { name, exact: true }),
    );
    const footerBoxes = await Promise.all(
      footerButtons.map((button) => button.boundingBox()),
    );
    const footerYs = footerBoxes.map((box) => Math.round(box!.y));

    expect(new Set(footerYs).size).toBe(1);
    for (const button of footerButtons) {
      await expectInsideViewport(page, button);
    }
  });

  test("keeps all debt actions on one row", async ({ page }) => {
    await page.goto("/hutang");

    const actionNames = [
      "Detail",
      "Cicilan",
      "Lunas",
      "Edit hutang Dempok",
      "Hapus hutang Dempok",
    ];
    const actions = actionNames.map((name) =>
      page.getByRole("button", { name, exact: true }),
    );
    const boxes = await Promise.all(actions.map((action) => action.boundingBox()));
    const actionYs = boxes.map((box) => Math.round(box!.y));

    expect(new Set(actionYs).size).toBe(1);
    for (const action of actions) {
      await expectInsideViewport(page, action);
      await expect(action).toHaveCSS("height", "44px");
    }

    const [editBox, deleteBox] = await Promise.all([
      actions[3].boundingBox(),
      actions[4].boundingBox(),
    ]);
    expect(Math.round(editBox!.width)).toBe(44);
    expect(Math.round(deleteBox!.width)).toBe(44);
    expect(editBox!.x).toBeLessThan(deleteBox!.x);
  });

  test("keeps debt detail and settlement forms inline with the card", async ({
    page,
  }) => {
    await page.goto("/hutang");

    await page.getByRole("button", { name: "Tambah", exact: true }).click();
    const debtDialog = page.getByRole("dialog");
    const debtDialogBox = await debtDialog.boundingBox();
    const viewport = page.viewportSize();
    expect(debtDialogBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(
      Math.abs(
        debtDialogBox!.y +
          debtDialogBox!.height / 2 -
          viewport!.height / 2,
      ),
    ).toBeLessThanOrEqual(1);
    await debtDialog.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "Detail", exact: true }).click();
    await expect(
      page.getByTestId(`hutang-detail-panel-${fixtureDebtId}`),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Lunas", exact: true }).click();
    await expect(
      page.getByTestId(`hutang-detail-panel-${fixtureDebtId}`),
    ).toBeHidden();
    await expect(
      page.getByTestId(`hutang-lunas-panel-${fixtureDebtId}`),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Lunaskan", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("contains transaction momentum scrolling inside the dialog frame", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await page.locator("#filter-periode").click();
    await page.getByRole("option", { name: "Semua Waktu" }).click();
    await page
      .getByRole("button", { name: "Edit transaksi TopUp Games" })
      .click();

    const dialog = page.getByRole("dialog");
    const scrollArea = dialog.locator('[data-slot="dialog-scroll"]');

    await expect(dialog).toHaveCSS("overflow-y", "hidden");
    await expect(scrollArea).toBeVisible();
    await expect(scrollArea).toHaveCSS("overflow-y", "auto");

    await scrollArea.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect
      .poll(() => scrollArea.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);

    await scrollArea.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect
      .poll(() => scrollArea.evaluate((element) => element.scrollTop))
      .toBe(0);
    await expect(
      dialog.getByRole("heading", { name: "Edit Transaksi" }),
    ).toBeVisible();
  });

  test("keeps the mobile sidebar within device safe areas", async ({ page }) => {
    await page.locator('[data-sidebar="trigger"]').click();

    const sidebar = page.locator('[data-mobile="true"]');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveCSS("transform", "none");
    await expect(sidebar).toHaveClass(/safe-area-inset-top/);
    await expect(sidebar).toHaveClass(/safe-area-inset-bottom/);
    await expectInsideViewport(page, sidebar);
    await expect(page.getByText("Mobile Tester")).toBeVisible();
  });
});

test("keeps compact mobile controls usable at 320px", async ({ page }) => {
  await page.setViewportSize(narrowViewport);
  await page.emulateMedia({ colorScheme: "light" });
  await login(page);
  await expect(page.locator("html")).toHaveClass(/light/);

  await expectInsideViewport(page, page.locator("#filter-rekening"));
  await page.getByRole("button", { name: "Transaksi Baru" }).click();
  await expectInsideViewport(page, page.getByRole("dialog"));
  await page.getByRole("button", { name: "Close" }).click();

  await page.goto("/hutang");
  const compactDebtActions = [
    "Detail",
    "Cicil",
    "Lunas",
    "Edit hutang Dempok",
    "Hapus hutang Dempok",
  ].map((name) => page.getByRole("button", { name, exact: true }));
  const compactActionBoxes = await Promise.all(
    compactDebtActions.map((action) => action.boundingBox()),
  );

  expect(
    new Set(compactActionBoxes.map((box) => Math.round(box!.y))).size,
  ).toBe(1);
  for (const action of compactDebtActions) {
    await expectInsideViewport(page, action);
  }
});

test("keeps transaction filters aligned on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page);

  const filters = [
    page.locator("#filter-sort"),
    page.locator("#filter-tipe"),
    page.locator("#filter-rekening"),
  ];
  const boxes = await Promise.all(filters.map((filter) => filter.boundingBox()));
  const filterYs = boxes.map((box) => Math.round(box!.y));

  expect(new Set(filterYs).size).toBe(1);
  for (const filter of filters) {
    await expectInsideViewport(page, filter);
  }
});
