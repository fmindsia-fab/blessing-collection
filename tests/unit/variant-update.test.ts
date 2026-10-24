import { beforeEach, describe, expect, it, vi } from "vitest";

// Declarados dentro do hoisted: o Vitest move esse bloco para o topo do
// arquivo, antes de qualquer const de módulo.
const { state, COLOR_ID, OTHER_COLOR_ID } = vi.hoisted(() => {
  // O schema valida UUID: ids curtos seriam recusados antes de chegar ao banco.
  const COLOR_ID = "11111111-1111-4111-8111-111111111111";
  const OTHER_COLOR_ID = "22222222-2222-4222-8222-222222222222";

  return {
    COLOR_ID,
    OTHER_COLOR_ID,
    state: {
      /** null simula produto de outra loja. */
      product: { id: "p1" } as { id: string } | null,
      /** null simula cor de outra loja. */
      color: { id: COLOR_ID } as { id: string } | null,
      /** Primeira gravação (a da própria variação). */
      updated: null as Record<string, unknown> | null,
      /** Todas as gravações, na ordem (a segunda propaga "pode escolher mais de uma" ao grupo). */
      updates: [] as Record<string, unknown>[],
      /** Colunas usadas no .eq() do update — a âncora no produto importa. */
      filters: [] as [string, string][],
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      let payload: Record<string, unknown> | null = null;

      const chain: Record<string, unknown> = {
        select: () => chain,
        update: (data: Record<string, unknown>) => {
          payload = data;
          return chain;
        },
        eq: (column: string, value: string) => {
          if (payload) state.filters.push([column, value]);
          return chain;
        },
        neq: () => chain,
        is: () => chain,
        maybeSingle: () =>
          Promise.resolve({ data: table === "colors" ? state.color : state.product }),
        then: (resolve: (r: { error: null }) => void) => {
          if (payload) {
            state.updates.push(payload);
            state.updated = state.updates[0];
          }
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return chain;
    },
  }),
}));

import { updateVariant } from "@/lib/products/variant-actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  state.product = { id: "p1" };
  state.color = { id: COLOR_ID };
  state.updated = null;
  state.updates = [];
  state.filters = [];
});

describe("updateVariant", () => {
  it("salva nome, grupo, cor e preço", async () => {
    const result = await updateVariant(
      "p1",
      "v1",
      {},
      form({ name: "Alça Corrente", variantGroup: "Alça", colorId: COLOR_ID, price: "409.90" }),
    );

    expect(result.error).toBeUndefined();
    expect(state.updated).toMatchObject({
      name: "Alça Corrente",
      variant_group: "Alça",
      color_id: COLOR_ID,
      price: 409.9,
    });
  });

  // Sem preço a variação usa o valor base da peça.
  it("grava null quando o preço fica em branco", async () => {
    await updateVariant("p1", "v1", {}, form({ name: "Marrom", price: "" }));

    expect(state.updated).toMatchObject({ price: null });
  });

  it("grava null quando o grupo fica em branco", async () => {
    await updateVariant("p1", "v1", {}, form({ name: "Marrom", variantGroup: "" }));

    expect(state.updated).toMatchObject({ variant_group: null });
  });

  it("aceita variação sem cor vinculada", async () => {
    const result = await updateVariant("p1", "v1", {}, form({ name: "Marrom", colorId: "" }));

    expect(result.error).toBeUndefined();
    expect(state.updated).toMatchObject({ color_id: null });
  });

  it("recusa nome vazio", async () => {
    const result = await updateVariant("p1", "v1", {}, form({ name: "" }));

    expect(result.error).toBeTruthy();
    expect(state.updated).toBeNull();
  });

  // A RLS bloquearia, mas a checagem explícita é a defesa da aplicação.
  it("recusa produto de outra loja", async () => {
    state.product = null;

    const result = await updateVariant("p1", "v1", {}, form({ name: "Marrom" }));

    expect(result.error).toBe("Produto não encontrado.");
    expect(state.updated).toBeNull();
  });

  it("recusa cor de outra loja", async () => {
    state.color = null;

    const result = await updateVariant(
      "p1",
      "v1",
      {},
      form({ name: "Marrom", colorId: OTHER_COLOR_ID }),
    );

    expect(result.error).toBe("Cor não encontrada.");
    expect(state.updated).toBeNull();
  });

  // Sem ancorar no produto validado, um id de variação de outra loja passaria
  // pela checagem de posse.
  it("ancora a gravação no produto validado", async () => {
    await updateVariant("p1", "v1", {}, form({ name: "Marrom" }));

    expect(state.filters).toContainEqual(["id", "v1"]);
    expect(state.filters).toContainEqual(["product_id", "p1"]);
  });

  // "Pode escolher mais de uma" vale para o grupo inteiro da peça: depois de salvar a variação, a
  // escolha é copiada para as outras do mesmo grupo (senão uma alça aceitaria duas e outra não).
  it("propaga 'pode escolher mais de uma' para o grupo da peça", async () => {
    await updateVariant("p1", "v1", {}, form({ name: "Alça Duo", variantGroup: "Alça", allowMultiple: "on" }));

    expect(state.updated).toMatchObject({ allow_multiple: true });
    expect(state.updates[1]).toEqual({ allow_multiple: true });
    expect(state.filters).toContainEqual(["variant_group", "Alça"]);
  });

  it("desmarcar também vale para o grupo todo", async () => {
    await updateVariant("p1", "v1", {}, form({ name: "Alça Duo", variantGroup: "Alça" }));

    expect(state.updates[1]).toEqual({ allow_multiple: false });
  });

  // A baixa de estoque depende de este vínculo ficar gravado.
  it("grava o material do estoque ligado à variação e a quantidade", async () => {
    const MATERIAL_ID = "33333333-3333-4333-8333-333333333333";
    const result = await updateVariant(
      "p1",
      "v1",
      {},
      form({ name: "Alça Metal", variantGroup: "Alça", materialId: MATERIAL_ID, materialQuantity: "2" }),
    );

    expect(result.error).toBeUndefined();
    expect(state.updated).toMatchObject({ material_id: MATERIAL_ID, material_quantity: 2 });
  });

  it("tirar o material (Nenhum) grava null e quantidade 1", async () => {
    await updateVariant("p1", "v1", {}, form({ name: "Alça Metal", materialId: "" }));

    expect(state.updated).toMatchObject({ material_id: null, material_quantity: 1 });
  });

  it("recusa material de outra loja", async () => {
    state.product = { id: "p1" };
    const result = await updateVariant(
      "p1",
      "v1",
      {},
      form({ name: "Alça Metal", materialId: "not-a-uuid" }),
    );

    expect(result.error).toBeTruthy();
    expect(state.updated).toBeNull();
  });
});

