import { describe, expect, it } from "vitest";
import { buildFilterHref } from "@/lib/catalog/filter-url";

describe("buildFilterHref", () => {
  it("devolve o caminho limpo quando nenhum filtro está ativo", () => {
    expect(buildFilterHref("/produtos", {})).toBe("/produtos");
  });

  // O erro clássico de barra de filtros: escolher a cor descarta o modelo.
  it("acumula filtros em vez de substituir", () => {
    const href = buildFilterHref("/produtos", {
      categoria: "bolsas",
      modelo: "clutch",
      cor: "marsala",
      disponibilidade: "available",
    });

    expect(href).toBe(
      "/produtos?categoria=bolsas&modelo=clutch&cor=marsala&disponibilidade=available",
    );
  });

  it("remove o filtro passado como undefined e mantém os demais", () => {
    const atual = { categoria: "bolsas", modelo: "clutch", cor: "marsala" };

    expect(buildFilterHref("/produtos", { ...atual, cor: undefined })).toBe(
      "/produtos?categoria=bolsas&modelo=clutch",
    );
  });

  it("preserva a busca ao trocar um filtro", () => {
    const href = buildFilterHref("/produtos", { busca: "bolsa de mão", cor: "nude" });

    expect(href).toBe("/produtos?busca=bolsa+de+m%C3%A3o&cor=nude");
  });

  // Ordem fixa: a mesma seleção precisa gerar sempre a mesma URL, senão o
  // histórico e o índice de busca acumulam duplicatas do mesmo resultado.
  it("mantém a ordem dos parâmetros independente da ordem das chaves", () => {
    const a = buildFilterHref("/produtos", { cor: "nude", categoria: "bolsas" });
    const b = buildFilterHref("/produtos", { categoria: "bolsas", cor: "nude" });

    expect(a).toBe(b);
    expect(a).toBe("/produtos?categoria=bolsas&cor=nude");
  });

  // Trocar de filtro precisa recomeçar a paginação; `page` nunca é propagado.
  it("não carrega a paginação da busca anterior", () => {
    const href = buildFilterHref("/produtos", { cor: "nude" });

    expect(href).not.toContain("page");
  });
});
