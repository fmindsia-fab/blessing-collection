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
      ownerName: "Maria da Silva",
      ownerCpf: "529.982.247-25",
      name: "Maria Bolsas",
      slug: "mariabolsas",
      whatsappNumber: "(11) 99999-9999",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsappNumber).toBe("11999999999");
  });

  it("rejeita WhatsApp com poucos dígitos", () => {
    const result = createStoreSchema.safeParse({
      ownerName: "Maria da Silva",
      ownerCpf: "529.982.247-25",
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

describe("createStoreSchema — CPF do responsável", () => {
  const base = { ownerName: "Maria da Silva", name: "Maria Bolsas", slug: "mariabolsas", whatsappNumber: "11999999999" };

  it("normaliza o CPF removendo pontuação", () => {
    const result = createStoreSchema.safeParse({ ...base, ownerCpf: "529.982.247-25" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.ownerCpf).toBe("52998224725");
  });

  it("rejeita CPF com dígito verificador errado ou sequência repetida", () => {
    expect(createStoreSchema.safeParse({ ...base, ownerCpf: "529.982.247-26" }).success).toBe(false);
    expect(createStoreSchema.safeParse({ ...base, ownerCpf: "111.111.111-11" }).success).toBe(false);
  });
});
