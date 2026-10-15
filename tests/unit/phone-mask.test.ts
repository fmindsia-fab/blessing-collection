import { describe, expect, it } from "vitest";
import { formatPhoneBR } from "@/lib/customers/phone-mask";

describe("formatPhoneBR", () => {
  it("formata celular completo com DDD", () => {
    expect(formatPhoneBR("43996980026")).toBe("(43) 99698-0026");
  });

  it("formata fixo completo com DDD", () => {
    expect(formatPhoneBR("4332221234")).toBe("(43) 3222-1234");
  });

  it("formata progressivamente enquanto digita", () => {
    expect(formatPhoneBR("4")).toBe("(4");
    expect(formatPhoneBR("43")).toBe("(43");
    expect(formatPhoneBR("439")).toBe("(43) 9");
    expect(formatPhoneBR("439969")).toBe("(43) 9969");
    expect(formatPhoneBR("4399698002")).toBe("(43) 9969-8002");
  });

  it("ignora caracteres não numéricos já digitados", () => {
    expect(formatPhoneBR("(43) 99698-0026")).toBe("(43) 99698-0026");
  });

  it("trunca além de 11 dígitos", () => {
    expect(formatPhoneBR("439969800261234")).toBe("(43) 99698-0026");
  });

  it("string vazia retorna vazio", () => {
    expect(formatPhoneBR("")).toBe("");
  });
});

import { formatWhatsappBR, normalizeWhatsappBR } from "@/lib/customers/phone-mask";
import { formatCpfCnpj } from "@/lib/br/document";

describe("WhatsApp da loja", () => {
  it("mostra DDD + número mesmo quando salvo com DDI 55", () => {
    expect(formatWhatsappBR("5543996980026")).toBe("(43) 99698-0026");
    expect(formatWhatsappBR("43996980026")).toBe("(43) 99698-0026");
  });

  it("normaliza para 55 + DDD + número, sem duplicar o DDI", () => {
    expect(normalizeWhatsappBR("(43) 99698-0026")).toBe("5543996980026");
    expect(normalizeWhatsappBR("5543996980026")).toBe("5543996980026");
    expect(normalizeWhatsappBR("123")).toBeNull();
  });
});

describe("formatCpfCnpj", () => {
  it("usa máscara de CPF até 11 dígitos e de CNPJ a partir do 12º", () => {
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatCpfCnpj("5299")).toBe("529.9");
  });
});
