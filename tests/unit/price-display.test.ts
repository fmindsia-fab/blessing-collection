import { describe, expect, it } from "vitest";
import { isPriceVariable, priceLabel } from "@/lib/pricing/price-display";
import {
  buildSelectionWhatsappMessage,
  buildWhatsappMessage,
} from "@/lib/whatsapp/build-message";

describe("isPriceVariable", () => {
  // Peça pronta tem preço firme: a ressalva enfraqueceria a confiança onde não
  // existe incerteza.
  it("só é variável sob encomenda", () => {
    expect(isPriceVariable("made_to_order")).toBe(true);
    expect(isPriceVariable("available")).toBe(false);
    expect(isPriceVariable("sold_out")).toBe(false);
    expect(isPriceVariable("inactive")).toBe(false);
  });
});

describe("priceLabel", () => {
  it("distingue valor firme de valor de referência", () => {
    expect(priceLabel("available")).toBe("Valor da peça");
    expect(priceLabel("made_to_order")).toBe("Valor de referência");
  });

  // "Investimento" é jargão de serviço; produto físico tem preço.
  it("não usa a palavra investimento", () => {
    for (const status of ["available", "made_to_order", "sold_out"] as const) {
      expect(priceLabel(status).toLowerCase()).not.toContain("investimento");
    }
  });
});

describe("aviso na mensagem do WhatsApp", () => {
  const base = {
    storeName: "Blessing Collection",
    productName: "Maxi Pulseira Malibu",
    variantLabel: null,
    productUrl: "https://exemplo.com/produtos/maxi-pulseira",
  };

  it("acrescenta a ressalva quando a peça é sob encomenda", () => {
    const message = buildWhatsappMessage({ ...base, status: "made_to_order" });

    expect(message).toContain("sujeito à confirmação");
  });

  it("não acrescenta nada quando a peça está pronta", () => {
    const message = buildWhatsappMessage({ ...base, status: "available" });

    expect(message).not.toContain("sujeito à confirmação");
  });

  it("não acrescenta em peça esgotada", () => {
    const message = buildWhatsappMessage({ ...base, status: "sold_out" });

    expect(message).not.toContain("sujeito à confirmação");
  });
});

describe("aviso na seleção múltipla", () => {
  const pronta = { name: "Veneza", url: "https://exemplo.com/v", status: "available" as const };
  const encomenda = {
    name: "Florence",
    url: "https://exemplo.com/f",
    status: "made_to_order" as const,
  };

  it("basta uma peça sob encomenda para a ressalva aparecer", () => {
    const message = buildSelectionWhatsappMessage("Blessing", [pronta, encomenda]);

    expect(message).toContain("sujeito à confirmação");
  });

  // Repetir por item tornaria a mensagem ilegível; a lista já marca cada uma.
  it("acrescenta a ressalva uma única vez", () => {
    const message = buildSelectionWhatsappMessage("Blessing", [encomenda, encomenda]);

    expect(message.match(/sujeito à confirmação/g)).toHaveLength(1);
  });

  it("omite a ressalva quando todas estão prontas", () => {
    const message = buildSelectionWhatsappMessage("Blessing", [pronta, pronta]);

    expect(message).not.toContain("sujeito à confirmação");
  });

  it("mantém a marcação por item na lista", () => {
    const message = buildSelectionWhatsappMessage("Blessing", [encomenda]);

    expect(message).toContain("(sob encomenda)");
  });
});
