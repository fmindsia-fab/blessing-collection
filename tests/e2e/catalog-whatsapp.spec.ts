import { test, expect } from "@playwright/test";

// Fluxo principal do PLAN.md (M7): home -> produto -> clique no WhatsApp,
// conferindo que o link wa.me sai com número e mensagem pré-formatada.

// Card de produto: link para o detalhe que contém o <h3> com o nome.
// Filtrar por has: h3 exclui "Voltar", paginação e outros links /produtos/*.
function productCards(page: import("@playwright/test").Page) {
  return page.locator('a[href^="/produtos/"]').filter({ has: page.locator("h3") });
}

async function openFirstProduct(page: import("@playwright/test").Page) {
  const card = productCards(page).first();
  await expect(card).toBeVisible();

  const name = (await card.locator("h3").textContent())?.trim();
  const href = await card.getAttribute("href");

  // Espera a navegação concluir em vez de assumir que o clique já mudou a URL.
  await Promise.all([page.waitForURL(`**${href}`), card.click()]);

  return name;
}

test("home lista produtos e navega para o detalhe", async ({ page }) => {
  await page.goto("/");

  const productName = await openFirstProduct(page);

  await expect(page).toHaveURL(/\/produtos\/[^/]+$/);
  if (productName) {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(productName);
  }
});

test("botão do WhatsApp aponta para wa.me com mensagem pré-formatada", async ({ page }) => {
  await page.goto("/produtos");

  await openFirstProduct(page);
  await expect(page).toHaveURL(/\/produtos\/[^/]+$/);

  const whatsappLink = page.locator('a[href^="https://wa.me/"]').first();
  await expect(whatsappLink).toBeVisible();

  const href = await whatsappLink.getAttribute("href");
  expect(href).toBeTruthy();

  const url = new URL(href!);
  expect(url.hostname).toBe("wa.me");

  // Número: só dígitos, nunca vazio.
  const phone = url.pathname.replace("/", "");
  expect(phone).toMatch(/^\d{10,15}$/);

  // Mensagem pré-formatada, com o link do produto embutido.
  const message = url.searchParams.get("text");
  expect(message).toBeTruthy();
  expect(message).toContain("Olá!");
  expect(message).toContain("/produtos/");

  // Abre em nova aba sem vazar o referrer.
  await expect(whatsappLink).toHaveAttribute("target", "_blank");
  await expect(whatsappLink).toHaveAttribute("rel", /noopener/);
});

test("o CTA do WhatsApp corresponde ao status do produto", async ({ page }) => {
  await page.goto("/produtos");
  await openFirstProduct(page);

  const whatsappLink = page.locator('a[href^="https://wa.me/"]').first();
  const label = (await whatsappLink.textContent())?.trim();

  // Os 3 status públicos têm CTA próprio (lib/whatsapp/build-message.ts).
  expect(["Quero esta bolsa", "Encomendar esta bolsa", "Consultar disponibilidade"]).toContain(label);
});

test("área administrativa exige login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});
