import { describe, expect, it } from "vitest";
import { accentInsensitivePattern, searchTokens } from "@/lib/catalog/search";

describe("searchTokens", () => {
  it("separa as palavras sem acento e em minúsculas", () => {
    expect(searchTokens("Bolsa de Couro")).toEqual(["bolsa", "de", "couro"]);
    expect(searchTokens("  ALÇA   Tiracolo ")).toEqual(["alca", "tiracolo"]);
  });

  it("descarta caracteres que quebrariam o filtro do banco", () => {
    expect(searchTokens("bolsa,(couro)*%\\")).toEqual(["bolsa", "couro"]);
    expect(searchTokens("a.b[c]")).toEqual([]);
  });

  it("ignora vazio e palavras de uma letra, e limita a quatro palavras", () => {
    expect(searchTokens("")).toEqual([]);
    expect(searchTokens(undefined)).toEqual([]);
    expect(searchTokens("a e o")).toEqual([]);
    expect(searchTokens("um dois tres quatro cinco seis")).toHaveLength(4);
  });

  it("não repete palavras", () => {
    expect(searchTokens("bolsa BOLSA bolsa")).toEqual(["bolsa"]);
  });
});

describe("accentInsensitivePattern", () => {
  const matches = (pattern: string, text: string) => new RegExp(pattern, "i").test(text);

  it("casa com e sem acento, e sem ligar para maiúscula", () => {
    const pattern = accentInsensitivePattern("alca");
    expect(matches(pattern, "Alça Tiracolo")).toBe(true);
    expect(matches(pattern, "alcas de bambu")).toBe(true);
    expect(matches(pattern, "ALCA")).toBe(true);
  });

  it("não casa com palavras diferentes", () => {
    expect(matches(accentInsensitivePattern("alca"), "Calça de brim")).toBe(true); // "alça" dentro de "calça" também casa: busca por trecho
    expect(matches(accentInsensitivePattern("couro"), "Fio de algodão")).toBe(false);
  });

  it("não deixa o texto digitado virar expressão regular", () => {
    // searchTokens já tirou os símbolos; a função só troca letras por classes.
    expect(accentInsensitivePattern("bolsa")).toBe("b[oóòôõö]ls[aáàâãä]");
  });
});
