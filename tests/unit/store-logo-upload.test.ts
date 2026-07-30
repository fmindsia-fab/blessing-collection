import { describe, expect, it, vi } from "vitest";

// O logo tem limite próprio (2MB, sem SVG) e precisa ser barrado no servidor
// antes de tocar o Storage — PRD seção 13.1 / PLAN.md risco 4.
const uploadSpy = vi.fn();
const updateSpy = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    storage: {
      from: () => ({
        upload: uploadSpy,
        getPublicUrl: () => ({ data: { publicUrl: "https://exemplo/logo.png" } }),
      }),
    },
    from: () => ({ update: updateSpy }),
  }),
}));

import { uploadStoreLogo } from "@/lib/store/actions";

function formDataWith(file: File) {
  const formData = new FormData();
  formData.set("logo", file);
  return formData;
}

describe("uploadStoreLogo", () => {
  it("rejeita SVG sem enviar ao Storage", async () => {
    const file = new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" });

    const result = await uploadStoreLogo({}, formDataWith(file));

    expect(result.error).toBe("Formato inválido. Use JPEG, PNG ou WebP (SVG não é aceito).");
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("rejeita arquivo acima de 2MB (limite menor que o das fotos de produto)", async () => {
    const oversized = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "logo.png", { type: "image/png" });

    const result = await uploadStoreLogo({}, formDataWith(oversized));

    expect(result.error).toBe("O logo deve ter no máximo 2MB.");
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it("rejeita quando nenhum arquivo foi selecionado", async () => {
    const result = await uploadStoreLogo({}, new FormData());

    expect(result.error).toBe("Selecione uma imagem.");
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});
