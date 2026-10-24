import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

import { getVariantMaterialNeeds } from "@/lib/orders/queries";

type Tables = Record<string, unknown[]>;

// Banco de mentira: cada tabela devolve as linhas combinadas, qualquer que seja o filtro.
function fakeSupabase(tables: Tables) {
  return {
    from: (table: string) => {
      const chain: Record<string, unknown> = {
        select: () => chain,
        in: () => chain,
        not: () => chain,
        then: (resolve: (value: { data: unknown[]; error: null }) => void) =>
          Promise.resolve(resolve({ data: tables[table] ?? [], error: null })),
      };
      return chain;
    },
  } as unknown as Parameters<typeof getVariantMaterialNeeds>[0];
}

const item = (quantity: number) => ({ order_id: "pedido-1", quantity });

describe("getVariantMaterialNeeds", () => {
  it("usa a cópia do pedido quando existe, multiplicada pela quantidade do item", async () => {
    const needs = await getVariantMaterialNeeds(
      fakeSupabase({
        order_item_variants: [
          { variant_id: "v1", material_id: "alca", material_quantity: 1, order_items: item(2) },
        ],
        materials: [{ id: "alca", name: "Alça Metal", unit: "Un" }],
      }),
      ["pedido-1"],
    );

    expect(needs).toEqual([{ materialId: "alca", name: "Alça Metal", unit: "Un", quantity: 2 }]);
  });

  it("quando a cópia está vazia (ligou o material depois do pedido), usa o vínculo atual da variação", async () => {
    const needs = await getVariantMaterialNeeds(
      fakeSupabase({
        order_item_variants: [{ variant_id: "v1", material_id: null, material_quantity: 1, order_items: item(1) }],
        product_variants: [{ id: "v1", material_id: "alca", material_quantity: 1 }],
        materials: [{ id: "alca", name: "Alça Tiracolo", unit: "un" }],
      }),
      ["pedido-1"],
    );

    expect(needs).toEqual([{ materialId: "alca", name: "Alça Tiracolo", unit: "un", quantity: 1 }]);
  });

  it("variação sem nenhum material ligado não gera necessidade", async () => {
    const needs = await getVariantMaterialNeeds(
      fakeSupabase({
        order_item_variants: [{ variant_id: "v2", material_id: null, material_quantity: 1, order_items: item(1) }],
        product_variants: [],
        materials: [],
      }),
      ["pedido-1"],
    );

    expect(needs).toEqual([]);
  });

  it("sem pedidos não consulta nada", async () => {
    expect(await getVariantMaterialNeeds(fakeSupabase({}), [])).toEqual([]);
  });
});
