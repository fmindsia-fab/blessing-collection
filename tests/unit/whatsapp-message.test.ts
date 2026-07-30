import { describe, expect, it } from "vitest";
import {
  buildSelectionWhatsappMessage,
  buildWhatsappLink,
  buildWhatsappMessage,
  getWhatsappCtaLabel,
} from "@/lib/whatsapp/build-message";

describe("buildWhatsappMessage", () => {
  const base = {
    storeName: "Blessing Collection",
    productName: "Bolsa Florence",
    variantLabel: "Cor: Topázio",
    productUrl: "https://blessing-collection.vercel.app/produtos/bolsa-florence",
  };

  it("gera mensagem de interesse na compra para status available", () => {
    const message = buildWhatsappMessage({ ...base, status: "available" });
    expect(message).toContain("Tenho interesse na Bolsa Florence, Cor: Topázio.");
    expect(message).toContain(base.productUrl);
    expect(getWhatsappCtaLabel("available")).toBe("Quero esta bolsa");
  });

  it("gera mensagem de encomenda para status made_to_order", () => {
    const message = buildWhatsappMessage({ ...base, status: "made_to_order" });
    expect(message).toContain("encomendar a Bolsa Florence");
    expect(message).toContain("prazo de produção");
    expect(getWhatsappCtaLabel("made_to_order")).toBe("Encomendar esta bolsa");
  });

  it("gera mensagem de consulta de disponibilidade para status sold_out", () => {
    const message = buildWhatsappMessage({ ...base, status: "sold_out" });
    expect(message).toContain("previsão de reposição");
    expect(getWhatsappCtaLabel("sold_out")).toBe("Consultar disponibilidade");
  });
});

describe("buildWhatsappLink", () => {
  it("monta link wa.me com número normalizado e mensagem codificada", () => {
    const link = buildWhatsappLink("+55 (11) 99999-9999", "Olá!");
    expect(link).toBe("https://wa.me/5511999999999?text=Ol%C3%A1!");
  });
});

describe("buildSelectionWhatsappMessage", () => {
  it("lista cada peça com nome e link", () => {
    const message = buildSelectionWhatsappMessage("Blessing Collection", [
      { name: "Bolsa Florence", url: "https://exemplo.com/produtos/bolsa-florence" },
      { name: "Bolsa Aurora", url: "https://exemplo.com/produtos/bolsa-aurora" },
    ]);

    expect(message).toContain("nestas 2 peças do catálogo da Blessing Collection");
    expect(message).toContain("• Bolsa Florence — https://exemplo.com/produtos/bolsa-florence");
    expect(message).toContain("• Bolsa Aurora — https://exemplo.com/produtos/bolsa-aurora");
  });

  it("usa singular quando há apenas uma peça", () => {
    const message = buildSelectionWhatsappMessage("Blessing Collection", [
      { name: "Bolsa Florence", url: "https://exemplo.com/produtos/bolsa-florence" },
    ]);

    expect(message).toContain("nesta peça do catálogo");
    expect(message).not.toContain("peças");
  });
});
