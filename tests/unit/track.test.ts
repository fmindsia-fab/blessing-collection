import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    from: () => ({
      insert: () => Promise.resolve({ error: { message: "falha simulada de rede" } }),
    }),
  }),
}));

import { track } from "@/lib/analytics/track";

describe("track", () => {
  it("retorna void de forma síncrona, sem aguardar o insert (nunca bloqueia a navegação)", () => {
    const result = track({ storeId: "store-1", eventType: "whatsapp_click", productId: "product-1" });
    expect(result).toBeUndefined();
  });
});
