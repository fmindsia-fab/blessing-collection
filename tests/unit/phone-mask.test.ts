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
