import { describe, expect, it, vi, beforeEach } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    isAdmin: true,
    updateError: null as { message: string } | null,
    updatedPayload: null as { status: string } | null,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/platform/get-platform-admin", () => ({
  isPlatformAdmin: async () => state.isAdmin,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => ({
      update: (payload: { status: string }) => {
        state.updatedPayload = payload;
        return {
          eq: async () => ({ error: state.updateError }),
        };
      },
    }),
  }),
}));

describe("setStoreStatus", () => {
  beforeEach(() => {
    state.isAdmin = true;
    state.updateError = null;
    state.updatedPayload = null;
  });

  it("rejeita quem não é platform admin, sem tocar no banco", async () => {
    state.isAdmin = false;
    const { setStoreStatus } = await import("@/lib/platform/actions");
    const result = await setStoreStatus("store-1", "suspended");

    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/restrito/i);
    expect(state.updatedPayload).toBeNull();
  });

  it("suspende a loja (status=suspended) quando chamado por um platform admin", async () => {
    const { setStoreStatus } = await import("@/lib/platform/actions");
    const result = await setStoreStatus("store-1", "suspended");

    expect(result.success).toBe(true);
    expect(state.updatedPayload).toEqual({ status: "suspended" });
  });

  it("reativa a loja (status=active)", async () => {
    const { setStoreStatus } = await import("@/lib/platform/actions");
    const result = await setStoreStatus("store-1", "active");

    expect(result.success).toBe(true);
    expect(state.updatedPayload).toEqual({ status: "active" });
  });

  it("retorna erro amigável se o update falhar no banco", async () => {
    state.updateError = { message: "db error" };
    const { setStoreStatus } = await import("@/lib/platform/actions");
    const result = await setStoreStatus("store-1", "active");

    expect(result.success).toBeUndefined();
    expect(result.error).toBeTruthy();
  });
});
