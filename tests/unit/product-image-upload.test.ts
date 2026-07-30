import { beforeEach, describe, expect, it, vi } from "vitest";

// O upload precisa ser rejeitado por tipo/tamanho ANTES de tocar Storage ou banco
// (PLAN.md risco 4: validação do client nunca é suficiente).
const uploadSpy = vi.fn(() => Promise.resolve({ error: null }));
const insertSpy = vi.fn(() => Promise.resolve({ error: null }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    storage: {
      from: () => ({
        upload: uploadSpy,
        getPublicUrl: () => ({ data: { publicUrl: "https://exemplo/imagem.jpg" } }),
      }),
    },
    from: () => {
      // `.eq()` encadeável: a contagem de imagens usa um .eq, e a checagem de
      // posse do produto usa dois .eq + .maybeSingle.
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: { id: "product-1" } }),
        insert: insertSpy,
        then: (resolve: (r: { count: number }) => void) => Promise.resolve(resolve({ count: 0 })),
      };
      return chain;
    },
  }),
}));

import { uploadProductImage } from "@/lib/products/image-actions";

function formDataWith(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return formData;
}

beforeEach(() => {
  uploadSpy.mockClear();
  insertSpy.mockClear();
});

describe("uploadProductImage", () => {
  it("rejeita formato não permitido (SVG) sem enviar ao Storage", async () => {
    const file = new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" });

    const result = await uploadProductImage("product-1", {}, formDataWith(file));

    expect(result.error).toBe("Formato inválido. Use JPEG, PNG ou WebP.");
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("rejeita arquivo acima de 10MB", async () => {
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "foto.jpg", { type: "image/jpeg" });

    const result = await uploadProductImage("product-1", {}, formDataWith(oversized));

    expect(result.error).toBe("A imagem deve ter no máximo 10MB.");
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it("aceita arquivo dentro do novo limite de 10MB", async () => {
    // 6MB seria rejeitado pelo limite anterior — garante que a ampliação valeu.
    const file = new File([new Uint8Array(6 * 1024 * 1024)], "foto.jpg", { type: "image/jpeg" });

    const result = await uploadProductImage("product-1", {}, formDataWith(file));

    expect(result.error).toBeUndefined();
    expect(uploadSpy).toHaveBeenCalled();
  });

  it("rejeita quando nenhum arquivo foi selecionado", async () => {
    const result = await uploadProductImage("product-1", {}, new FormData());

    expect(result.error).toBe("Selecione uma imagem.");
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});
