import { beforeEach, describe, expect, it, vi } from "vitest";

// `vi.mock` sofre hoisting acima dos imports, então o array precisa ser criado
// dentro da factory e exposto via vi.hoisted — uma const normal aqui ainda
// seria undefined quando o mock rodar.
const { inserted } = vi.hoisted(() => ({ inserted: [] as Record<string, unknown>[] }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      const chain: Record<string, unknown> = {
        insert: (payload: Record<string, unknown>) => {
          inserted.push(payload);
          return chain;
        },
        select: () => chain,
        single: () => Promise.resolve({ data: { id: "novo" }, error: null }),
        update: () => chain,
        eq: () => chain,
      };
      return chain;
    },
  }),
}));

// `redirect()` do Next lança uma exceção de controle em caso de sucesso — é o
// comportamento normal, não um erro. Sem capturar, o teste falharia mesmo com
// o insert já executado.
async function submit(data: FormData) {
  try {
    return await createProduct({}, data);
  } catch {
    return {};
  }
}

import { createProduct } from "@/lib/products/actions";

// O formulário real sempre envia todos os campos de texto (vazios ou não).
// `formData.get()` devolve null para campo ausente, que o schema rejeita —
// então o helper precisa espelhar o form completo.
function form(fields: Record<string, string>) {
  const data = new FormData();
  data.set("name", "Bolsa Teste");
  data.set("price", "100");
  data.set("status", "available");
  data.set("description", "");
  data.set("materials", "");
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  inserted.length = 0;
});

describe("peso e dimensões", () => {
  it("grava os valores numéricos informados", async () => {
    await submit(form({ weightKg: "0.428", lengthCm: "28", widthCm: "10", heightCm: "25" }));

    expect(inserted[0]).toMatchObject({
      weight_kg: 0.428,
      length_cm: 28,
      width_cm: 10,
      height_cm: 25,
    });
  });

  // Campo em branco precisa virar null ("não informado"), nunca 0 — zero
  // apareceria como "0 kg" na página pública e violaria o check da migration.
  it("converte campo vazio em null, não em zero", async () => {
    await submit(form({ weightKg: "", lengthCm: "", widthCm: "", heightCm: "" }));

    expect(inserted[0]).toMatchObject({
      weight_kg: null,
      length_cm: null,
      width_cm: null,
      height_cm: null,
    });
  });

  it("aceita preenchimento parcial", async () => {
    await submit(form({ weightKg: "0.5", lengthCm: "", widthCm: "", heightCm: "" }));

    expect(inserted[0]).toMatchObject({ weight_kg: 0.5, length_cm: null });
  });

  it("rejeita valor negativo em vez de gravar", async () => {
    const result = await submit(form({ weightKg: "-2" }));

    expect(result.error).toBeTruthy();
    expect(inserted).toHaveLength(0);
  });

  it("rejeita zero — não descreve uma peça física", async () => {
    const result = await submit(form({ lengthCm: "0" }));

    expect(result.error).toBeTruthy();
    expect(inserted).toHaveLength(0);
  });

  it("produto sem os campos continua válido (peças antigas)", async () => {
    await submit(form({}));

    expect(inserted[0]).toMatchObject({ weight_kg: null });
  });
});
