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
      updated: null as Record<string, unknown> | null,
      /** Colunas usadas no .eq() do update — a âncora no produto importa. */
      filters: [] as [string, string][],
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/store/get-owner-store", () => ({
  getOwnerStore: async () => ({ id: "store-1", slug: "store-1" }),
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
        maybeSingle: () =>
          Promise.resolve({ data: table === "colors" ? state.color : state.product }),
        then: (resolve: (r: { error: null }) => void) => {
          if (payload) state.updated = payload;
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
});
