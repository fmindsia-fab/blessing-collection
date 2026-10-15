import { describe, expect, it } from "vitest";
import { marketplaceExtrasColumns, normalizeInstagramUrl } from "@/lib/store/craft-profile";

describe("normalizeInstagramUrl", () => {
  it("aceita @usuario, instagram.com/usuario e URL completa", () => {
    expect(normalizeInstagramUrl("@meuatelie")).toBe("https://instagram.com/meuatelie");
    expect(normalizeInstagramUrl("instagram.com/meuatelie/")).toBe("https://instagram.com/meuatelie");
    expect(normalizeInstagramUrl("https://www.instagram.com/meuatelie")).toBe(
      "https://www.instagram.com/meuatelie",
    );
  });

  it("rejeita domínio que não é do Instagram e lixo", () => {
    expect(normalizeInstagramUrl("https://evil.com/meuatelie")).toBeNull();
    expect(normalizeInstagramUrl("meu atelie!!")).toBeNull();
    expect(normalizeInstagramUrl("   ")).toBeNull();
  });
});

describe("marketplaceExtrasColumns", () => {
  const extras = { acceptsCustomOrders: true, shipsNationwide: null, yearsActive: "1to3", marketplaceOptIn: true };

  it("registra a data só quando o consentimento passa a valer", () => {
    const first = marketplaceExtrasColumns(extras, { marketplace_opt_in: false, marketplace_opt_in_at: null });
    expect(first.marketplace_opt_in_at).toEqual(expect.any(String));
  });

  it("não renova a data ao salvar de novo com o consentimento mantido", () => {
    const kept = marketplaceExtrasColumns(extras, {
      marketplace_opt_in: true,
      marketplace_opt_in_at: "2026-10-01T00:00:00.000Z",
    });
    expect(kept.marketplace_opt_in_at).toBe("2026-10-01T00:00:00.000Z");
  });

  it("limpa a data ao retirar o consentimento", () => {
    const revoked = marketplaceExtrasColumns(
      { ...extras, marketplaceOptIn: false },
      { marketplace_opt_in: true, marketplace_opt_in_at: "2026-10-01T00:00:00.000Z" },
    );
    expect(revoked).toMatchObject({ marketplace_opt_in: false, marketplace_opt_in_at: null });
  });
});
