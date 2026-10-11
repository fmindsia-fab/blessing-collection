import { beforeEach, describe, expect, it, vi } from "vitest";

// Teste de isolamento multi-tenant exigido pelo plano de evolução SaaS
// (Milestone 1): confirma que dois hosts diferentes, em requisições
// distintas, nunca retornam a loja um do outro via getActiveStore().

const { state } = vi.hoisted(() => ({
  state: {
    currentHeaders: new Map<string, string>(),
    stores: [
      { id: "store-blessing", slug: "blessing-collection", status: "active", domain: "blessing.com.br" },
      { id: "store-maria", slug: "mariabolsas", status: "active", domain: null as string | null },
    ],
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (key: string) => state.currentHeaders.get(key) ?? null,
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from(table: string) {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq(column: string, value: string) {
          (chain as { _filters?: Record<string, string> })._filters = {
            ...((chain as { _filters?: Record<string, string> })._filters ?? {}),
            [column]: value,
          };
          return chain;
        },
        maybeSingle() {
          const filters = (chain as { _filters?: Record<string, string> })._filters ?? {};
          if (table === "store_domains") {
            const match = state.stores.find((s) => s.domain === filters.domain);
            return Promise.resolve({ data: match ? { store_id: match.id } : null });
          }
          if (table === "stores") {
            const match = state.stores.find(
              (s) =>
                (filters.slug ? s.slug === filters.slug : true) &&
                (filters.id ? s.id === filters.id : true) &&
                (filters.status ? s.status === filters.status : true),
            );
            return Promise.resolve({ data: match ?? null });
          }
          return Promise.resolve({ data: null });
        },
      };
      return chain;
    },
  }),
}));

describe("isolamento multi-tenant via getActiveStore (modo host)", () => {
  beforeEach(() => {
    vi.resetModules();
    state.currentHeaders = new Map();
  });

  it("resolve lojas diferentes para subdomínios diferentes, sem vazamento cruzado", async () => {
    process.env.TENANT_RESOLUTION_MODE = "host";
    const { getActiveStore } = await import("@/lib/store/get-active-store");

    state.currentHeaders = new Map([["x-tenant-slug", "mariabolsas"]]);
    const mariaStore = await getActiveStore();
    expect(mariaStore.id).toBe("store-maria");

    vi.resetModules();
    const { getActiveStore: getActiveStore2 } = await import("@/lib/store/get-active-store");
    state.currentHeaders = new Map([["x-tenant-domain", "blessing.com.br"]]);
    const blessingStore = await getActiveStore2();
    expect(blessingStore.id).toBe("store-blessing");

    expect(mariaStore.id).not.toBe(blessingStore.id);
  });

  it("não encontra loja alguma quando o host não corresponde a nenhum tenant", async () => {
    process.env.TENANT_RESOLUTION_MODE = "host";
    const { getActiveStore } = await import("@/lib/store/get-active-store");

    state.currentHeaders = new Map([["x-tenant-slug", "loja-inexistente"]]);
    await expect(getActiveStore()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
