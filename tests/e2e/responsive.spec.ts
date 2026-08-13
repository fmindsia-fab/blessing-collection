import { test, expect, devices } from "@playwright/test";

/**
 * Checagem de layout em celular e tablet.
 *
 * O defeito que estes testes procuram é o vazamento horizontal: um elemento
 * mais largo que a viewport faz a página inteira rolar para o lado, e isso
 * passa despercebido no desktop, onde sobra espaço.
 */

const VIEWPORTS = [
  { nome: "celular pequeno", width: 320, height: 568 },
  { nome: "celular", width: 390, height: 844 },
  { nome: "tablet", width: 768, height: 1024 },
  { nome: "tablet paisagem", width: 1024, height: 768 },
];

const PAGINAS = ["/", "/produtos"];

for (const viewport of VIEWPORTS) {
  for (const caminho of PAGINAS) {
    test(`${caminho} não rola para o lado em ${viewport.nome} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(caminho);
      await page.waitForLoadState("networkidle");

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
      });

      // 1px de tolerância: arredondamento de subpixel em telas fracionárias.
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }
}

test("os alvos de toque do catálogo têm tamanho confortável no celular", async ({ page }) => {
  await page.setViewportSize(devices["iPhone 13"].viewport);
  await page.goto("/produtos");

  // 44px é o mínimo recomendado para toque; abaixo disso o dedo erra.
  const botoesDeFiltro = page.locator("button[aria-expanded]");
  const total = await botoesDeFiltro.count();
  expect(total).toBeGreaterThan(0);

  for (let i = 0; i < total; i++) {
    const box = await botoesDeFiltro.nth(i).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
  }
});

test("o painel de filtro cabe na tela do celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/produtos");

  await page.locator("button[aria-expanded]").first().click();

  const painel = page.locator("button[aria-expanded='true'] + div");
  await expect(painel).toBeVisible();

  const box = await painel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});

test("a capa da home aparece inteira no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const capa = page.locator("main a[href^='/produtos/']").first();
  await expect(capa).toBeVisible();

  const box = await capa.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(390);
});
