import { describe, expect, it } from "vitest";
import { nextCopyIdentity } from "@/lib/products/duplicate";

describe("nextCopyIdentity", () => {
  it("usa 'Nome (cópia)' quando está livre", () => {
    expect(nextCopyIdentity("Bolsa Florence", ["bolsa-florence"])).toEqual({
      name: "Bolsa Florence (cópia)",
      slug: "bolsa-florence-copia",
    });
  });

  it("pula para (cópia 2), (cópia 3) quando o endereço já existe na loja", () => {
    expect(nextCopyIdentity("Bolsa Florence", ["bolsa-florence-copia"]).name).toBe("Bolsa Florence (cópia 2)");
    expect(
      nextCopyIdentity("Bolsa Florence", ["bolsa-florence-copia", "bolsa-florence-copia-2"]),
    ).toEqual({ name: "Bolsa Florence (cópia 3)", slug: "bolsa-florence-copia-3" });
  });

  it("copiar uma cópia gera nome novo sem colidir", () => {
    const result = nextCopyIdentity("Bolsa Florence (cópia)", ["bolsa-florence-copia", "bolsa-florence-copia-copia"]);
    expect(result.slug).toBe("bolsa-florence-copia-copia-2");
  });
});
