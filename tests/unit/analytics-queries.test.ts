import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
const eventRows = [
  // created_at relativo a "agora" — a fixture cobre dentro e fora da janela de 7 dias.
  { event_type: "product_view", daysAgo: 1 },
  { event_type: "product_view", daysAgo: 2 },
  { event_type: "whatsapp_click", daysAgo: 3 },
  { event_type: "product_view", daysAgo: 20 },
  { event_type: "whatsapp_click", daysAgo: 40 },
];

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    rpc: (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      return Promise.resolve({ data: [], error: null });
    },
    from: () => {
      const filters: { eventType?: string; since?: string } = {};
      const builder = {
        select: () => builder,
        eq: (column: string, value: string) => {
          if (column === "event_type") filters.eventType = value;
          return builder;
        },
        gte: (_column: string, value: string) => {
          filters.since = value;
          return builder;
        },
        then: (resolve: (result: { count: number; error: null }) => void) => {
          const count = eventRows.filter((row) => {
            if (row.event_type !== filters.eventType) return false;
            if (!filters.since) return true;
            const createdAt = Date.now() - row.daysAgo * 24 * 60 * 60 * 1000;
            return createdAt >= new Date(filters.since).getTime();
          }).length;
          return Promise.resolve(resolve({ count, error: null }));
        },
      };
      return builder;
    },
  }),
}));

import {
  getAnalyticsTotals,
  getProductRankings,
  interestRate,
  parsePeriod,
  periodToDays,
} from "@/lib/analytics/queries";

beforeEach(() => {
  rpcCalls.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("interestRate", () => {
  it("calcula a taxa de interesse para um fixture conhecido", () => {
    // 3 cliques em 12 visualizações = 25%
    expect(interestRate(12, 3)).toBe(25);
  });

  it("arredonda para 2 casas, como a RPC", () => {
    // 1/3 = 33,333...% -> 33.33
    expect(interestRate(3, 1)).toBe(33.33);
  });

  it("retorna 0 quando não há visualizações (evita divisão por zero)", () => {
    expect(interestRate(0, 5)).toBe(0);
  });
});

describe("período", () => {
  it("converte 'total' em p_days null e os demais em número", () => {
    expect(periodToDays("total")).toBeNull();
    expect(periodToDays("7")).toBe(7);
    expect(periodToDays("90")).toBe(90);
  });

  it("cai no padrão de 30 dias para valor ausente ou inválido", () => {
    expect(parsePeriod(undefined)).toBe("30");
    expect(parsePeriod("999")).toBe("30");
    expect(parsePeriod("7")).toBe("7");
  });

  it("repassa p_days para a RPC conforme o período escolhido", async () => {
    await getProductRankings("store-1", "7");
    await getProductRankings("store-1", "total");

    expect(rpcCalls[0]).toEqual({ fn: "get_product_rankings", args: { p_store_id: "store-1", p_days: 7 } });
    expect(rpcCalls[1]).toEqual({ fn: "get_product_rankings", args: { p_store_id: "store-1", p_days: null } });
  });
});

describe("getAnalyticsTotals", () => {
  it("com período de 7 dias exclui eventos fora da janela", async () => {
    const totals = await getAnalyticsTotals("store-1", "7");

    // Dentro de 7 dias: 2 product_view (1 e 2 dias) e 1 whatsapp_click (3 dias).
    expect(totals.productViews).toBe(2);
    expect(totals.whatsappClicks).toBe(1);
    expect(totals.interestRate).toBe(50);
  });

  it("com período total inclui todos os eventos", async () => {
    const totals = await getAnalyticsTotals("store-1", "total");

    expect(totals.productViews).toBe(3);
    expect(totals.whatsappClicks).toBe(2);
  });
});
