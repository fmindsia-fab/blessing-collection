import { describe, expect, it } from "vitest";
import { slugSchema, createStoreSchema, slugify } from "@/lib/onboarding/schema";

describe("slugSchema", () => {
  it("aceita um slug válido", () => {
    expect(slugSchema.safeParse("mariabolsas").success).toBe(true);
  });

  it("rejeita slugs reservados para a plataforma", () => {
    const result = slugSchema.safeParse("admin");
    expect(result.success).toBe(false);
  });

  it("rejeita slugs curtos demais", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false);
  });

  it("rejeita hífen no início ou fim", () => {
    expect(slugSchema.safeParse("-maria").success).toBe(false);
    expect(slugSchema.safeParse("maria-").success).toBe(false);
  });

  it("rejeita maiúsculas e caracteres especiais", () => {
    expect(slugSchema.safeParse("Maria_Bolsas!").success).toBe(false);
  });

  it("normaliza para minúsculas antes de validar", () => {
    const result = slugSchema.safeParse("MariaBolsas");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("mariabolsas");
  });
});

describe("createStoreSchema", () => {
  it("normaliza o WhatsApp removendo caracteres não numéricos", () => {
    const result = createStoreSchema.safeParse({
      name: "Maria Bolsas",
      slug: "mariabolsas",
      whatsappNumber: "(11) 99999-9999",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsappNumber).toBe("11999999999");
  });

  it("rejeita WhatsApp com poucos dígitos", () => {
    const result = createStoreSchema.safeParse({
      name: "Maria Bolsas",
      slug: "mariabolsas",
      whatsappNumber: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("slugify", () => {
  it("transforma nome com acentos e espaços em slug válido", () => {
    expect(slugify("Maria Bolsas & Acessórios")).toBe("maria-bolsas-acessorios");
  });

  it("trunca no limite de 63 caracteres de um subdomínio", () => {
    const longName = "a".repeat(100);
    expect(slugify(longName).length).toBeLessThanOrEqual(63);
  });
});
