import { describe, expect, it, vi } from "vitest";

// O upload precisa ser rejeitado por tipo/tamanho ANTES de tocar Storage ou banco
// (PLAN.md risco 4: validação do client nunca é suficiente).
const uploadSpy = vi.fn();
const insertSpy = vi.fn();

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
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ count: 0 }) }),
      insert: insertSpy,
    }),
  }),
}));

import { uploadProductImage } from "@/lib/products/image-actions";

function formDataWith(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return formData;
}

describe("uploadProductImage", () => {
  it("rejeita formato não permitido (SVG) sem enviar ao Storage", async () => {
    const file = new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" });

    const result = await uploadProductImage("product-1", {}, formDataWith(file));

    expect(result.error).toBe("Formato inválido. Use JPEG, PNG ou WebP.");
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("rejeita arquivo acima de 5MB", async () => {
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "foto.jpg", { type: "image/jpeg" });

    const result = await uploadProductImage("product-1", {}, formDataWith(oversized));

    expect(result.error).toBe("A imagem deve ter no máximo 5MB.");
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it("rejeita quando nenhum arquivo foi selecionado", async () => {
    const result = await uploadProductImage("product-1", {}, new FormData());

    expect(result.error).toBe("Selecione uma imagem.");
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});
