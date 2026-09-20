import { describe, expect, it } from "vitest";
import { buildInvoiceMessage } from "@/lib/orders/build-invoice-message";
import { formatBRL } from "@/lib/orders/labels";

describe("buildInvoiceMessage", () => {
  it("inclui loja, cliente, data, itens com subtotal, total, chave PIX e cupom", () => {
    const message = buildInvoiceMessage({
      storeName: "Blessing Collection",
      customerName: "Marli Sazaki",
      orderDate: "2026-09-04",
      items: [
        { name: "Clutch Bellagio", quantity: 1, unitPrice: 419.9 },
        { name: "Mandala Divino Espírito Santo", quantity: 2, unitPrice: 54.85 },
      ],
      totalAmount: 529.6,
      pixKey: "blessing@pix.com",
      couponCode: "MARLI",
      couponPercent: 10,
    });

    expect(message).toContain("Blessing Collection");
    expect(message).toContain("Marli Sazaki");
    expect(message).toContain("04/09/2026");
    expect(message).toContain(
      `• Clutch Bellagio — 1 × ${formatBRL(419.9)} = ${formatBRL(419.9)}`,
    );
    expect(message).toContain(
      `• Mandala Divino Espírito Santo — 2 × ${formatBRL(54.85)} = ${formatBRL(109.7)}`,
    );
    expect(message).toContain(`Total: ${formatBRL(529.6)}`);
    expect(message).toContain("Chave PIX: blessing@pix.com");
    expect(message).toContain("cupom *MARLI* com 10% de desconto");
  });

  it("omite a linha de chave PIX quando não configurada", () => {
    const message = buildInvoiceMessage({
      storeName: "Blessing Collection",
      customerName: "Ana",
      orderDate: "2026-09-04",
      items: [{ name: "Bolsa", quantity: 1, unitPrice: 100 }],
      totalAmount: 100,
      pixKey: null,
      couponCode: "ANA",
      couponPercent: 10,
    });

    expect(message).not.toContain("Chave PIX");
  });

  it("omite a linha de cupom quando o código vem vazio", () => {
    const message = buildInvoiceMessage({
      storeName: "Blessing Collection",
      customerName: "Ana",
      orderDate: "2026-09-04",
      items: [{ name: "Bolsa", quantity: 1, unitPrice: 100 }],
      totalAmount: 100,
      pixKey: null,
      couponCode: "   ",
      couponPercent: 10,
    });

    expect(message).not.toContain("cupom");
  });
});
