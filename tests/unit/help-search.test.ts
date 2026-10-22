import { describe, expect, it } from "vitest";
import { HELP_TASKS } from "@/lib/help/tasks";
import { searchHelp } from "@/lib/help/search";

const first = (query: string) => searchHelp(query)[0]?.id;

describe("busca da Ajuda", () => {
  it("encontra a tarefa certa para pedidos comuns, com ou sem acento", () => {
    expect(first("cadastrar produto")).toBe("cadastrar-peca");
    expect(first("quero cadastrar uma peça nova")).toBe("cadastrar-peca");
    expect(first("mudar preço")).toBe("mudar-preco");
    expect(first("como troco o preco de uma bolsa")).toBe("mudar-preco");
    expect(first("colocar foto")).toBe("fotos");
    expect(first("cancelar pedido")).toBe("cancelar-pedido");
    expect(first("trocar logo")).toBe("logo");
    expect(first("letra pequena")).toBe("texto-maior");
  });

  it("não devolve nada para texto sem relação ou vazio", () => {
    expect(searchHelp("")).toEqual([]);
    expect(searchHelp("xyzqw")).toEqual([]);
  });
});

describe("roteiros da Ajuda", () => {
  it("têm ids únicos e ao menos um passo", () => {
    const ids = HELP_TASKS.map((task) => task.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const task of HELP_TASKS) expect(task.steps.length).toBeGreaterThan(0);
  });

  it("só levam a telas do painel", () => {
    for (const task of HELP_TASKS) {
      for (const step of task.steps) {
        if (step.href) expect(step.href.startsWith("/admin")).toBe(true);
      }
    }
  });
});
