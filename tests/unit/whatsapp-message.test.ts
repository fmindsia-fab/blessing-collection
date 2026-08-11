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
    expect(message).toContain("Tenho interesse nesta peça: Bolsa Florence, Cor: Topázio.");
    expect(message).toContain(base.productUrl);
    expect(getWhatsappCtaLabel("available")).toBe("Quero esta peça");
  });

  it("gera mensagem de encomenda para status made_to_order", () => {
    const message = buildWhatsappMessage({ ...base, status: "made_to_order" });
    expect(message).toContain("encomendar: Bolsa Florence");
    expect(message).toContain("prazo de produção");
    expect(getWhatsappCtaLabel("made_to_order")).toBe("Encomendar esta peça");
  });

  it("gera mensagem de consulta de disponibilidade para status sold_out", () => {
    const message = buildWhatsappMessage({ ...base, status: "sold_out" });
    expect(message).toContain("previsão de reposição");
    expect(getWhatsappCtaLabel("sold_out")).toBe("Consultar disponibilidade");
  });

  // O catálogo não é só de bolsas: o texto não pode assumir o gênero do nome
  // ("a Colar Aurora") nem chamar toda peça de bolsa.
  it("não concorda em gênero com o nome da peça", () => {
    const masculino = {
      ...base,
      productName: "Colar Aurora",
      variantLabel: null,
      productUrl: "https://exemplo.com/produtos/colar-aurora",
    };

    for (const status of ["available", "made_to_order", "sold_out"] as const) {
      const message = buildWhatsappMessage({ ...masculino, status });
      expect(message).not.toMatch(/\b[ao] Colar Aurora\b/);
      expect(message.toLowerCase()).not.toContain("bolsa");
      expect(getWhatsappCtaLabel(status).toLowerCase()).not.toContain("bolsa");
    }
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

  // A proprietária precisa saber que a peça está esgotada sem abrir o link,
  // senão responde como se estivesse disponível.
  it("sinaliza peça esgotada na linha correspondente", () => {
    const message = buildSelectionWhatsappMessage("Blessing Collection", [
      { name: "Bolsa Florence", url: "https://exemplo.com/a", status: "available" },
      { name: "Bolsa Aurora", url: "https://exemplo.com/b", status: "sold_out" },
    ]);

    expect(message).toContain("• Bolsa Florence — https://exemplo.com/a");
    expect(message).toContain("• Bolsa Aurora (esgotada — gostaria de saber sobre reposição)");
  });

  it("sinaliza peça sob encomenda", () => {
    const message = buildSelectionWhatsappMessage("Blessing Collection", [
      { name: "Bolsa Aurora", url: "https://exemplo.com/b", status: "made_to_order" },
    ]);

    expect(message).toContain("• Bolsa Aurora (sob encomenda)");
  });

  it("não adiciona sufixo quando o status não foi informado", () => {
    const message = buildSelectionWhatsappMessage("Blessing Collection", [
      { name: "Bolsa Florence", url: "https://exemplo.com/a" },
    ]);

    expect(message).toContain("• Bolsa Florence — https://exemplo.com/a");
    expect(message).not.toContain("(");
  });
});
