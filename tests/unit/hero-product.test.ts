import { describe, expect, it } from "vitest";
import { pickHeroProduct } from "@/lib/catalog/hero";

function peca(id: string, comFoto = true) {
  return {
    id,
    slug: id,
    name: id,
    cover_image_url: comFoto ? `https://exemplo.com/${id}.jpg` : null,
  };
}

describe("pickHeroProduct", () => {
  it("devolve null quando não há peça alguma", () => {
    expect(pickHeroProduct([], [])).toBeNull();
  });

  // A capa é uma seção de imagem: sem foto não há o que mostrar.
  it("ignora peças sem foto de capa", () => {
    const escolhida = pickHeroProduct([peca("sem-foto", false)], [peca("com-foto")]);

    expect(escolhida?.id).toBe("com-foto");
  });

  it("devolve null quando nenhuma peça tem foto", () => {
    expect(pickHeroProduct([peca("a", false)], [peca("b", false)])).toBeNull();
  });

  // Uma peça pode ser destaque e lançamento ao mesmo tempo; contá-la duas vezes
  // dobraria a chance dela em relação às outras.
  it("não repete peça presente nos dois grupos", () => {
    const repetida = peca("mesma");
    const vistos = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const escolhida = pickHeroProduct([repetida, peca("so-destaque")], [repetida]);
      if (escolhida) vistos.add(escolhida.id);
    }

    expect([...vistos].sort()).toEqual(["mesma", "so-destaque"]);
  });

  it("sorteia entre as peças disponíveis em vez de fixar a primeira", () => {
    const opcoes = [peca("a"), peca("b"), peca("c")];
    const vistos = new Set<string>();

    // 60 sorteios entre 3 opções: a chance de uma nunca sair é desprezível
    // (2/3 elevado a 60), então um resultado fixo reprova aqui.
    for (let i = 0; i < 60; i++) {
      const escolhida = pickHeroProduct(opcoes, []);
      if (escolhida) vistos.add(escolhida.id);
    }

    expect(vistos.size).toBe(3);
  });

  it("considera também os lançamentos, não só os destaques", () => {
    const vistos = new Set<string>();

    for (let i = 0; i < 60; i++) {
      const escolhida = pickHeroProduct([peca("destaque")], [peca("lancamento")]);
      if (escolhida) vistos.add(escolhida.id);
    }

    expect([...vistos].sort()).toEqual(["destaque", "lancamento"]);
  });
});
