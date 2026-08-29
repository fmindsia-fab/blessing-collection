import { describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({ state: { selectedColumns: "" } }));

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      const chain: Record<string, unknown> = {
        select: (columns: string) => {
          state.selectedColumns = columns;
          return chain;
        },
        eq: () => chain,
        single: () =>
          Promise.resolve({ data: { id: "s1", slug: "loja-teste", status: "active" }, error: null }),
      };
      return chain;
    },
  }),
}));

import { getStoreBySlug } from "@/lib/store/get-store-by-slug";

// A policy pública (stores_public_read_active) libera SELECT em qualquer
// coluna de `stores`, inclusive as de precificação interna (monthly_pay,
// tax_percent, default_margin_percent...). select("*") no lado público
// exporia esses dados na resposta bruta da API, mesmo que a UI não os
// renderize. Este teste trava a lista explícita de colunas.
describe("getStoreBySlug", () => {
  it("nunca usa select(*) — só colunas públicas, sem dados de precificação", async () => {
    await getStoreBySlug("loja-teste");

    expect(state.selectedColumns).not.toBe("*");
    for (const sensitive of [
      "monthly_pay",
      "monthly_fixed_cost",
      "productive_hours_per_month",
      "tax_regime",
      "tax_percent",
      "default_pricing_method",
      "default_margin_percent",
      "owner_user_id",
    ]) {
      expect(state.selectedColumns).not.toContain(sensitive);
    }
  });

  it("inclui os campos que a UI pública realmente usa", async () => {
    await getStoreBySlug("loja-teste");

    for (const field of [
      "name",
      "description",
      "whatsapp_number",
      "logo_url",
      "instagram_url",
      "brand_colors",
      "font_family",
    ]) {
      expect(state.selectedColumns).toContain(field);
    }
  });
});
