import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AnalyticsEventType } from "@/types/database.types";
import { buildDailySeries, type DailyPoint } from "./series";

// Períodos aceitos no filtro do painel. `total` vira p_days = null na RPC.
export const ANALYTICS_PERIODS = ["7", "30", "90", "total"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const DEFAULT_PERIOD: AnalyticsPeriod = "30";

export const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  "7": "Últimos 7 dias",
  "30": "Últimos 30 dias",
  "90": "Últimos 90 dias",
  total: "Todo o período",
};

export function parsePeriod(value: string | undefined): AnalyticsPeriod {
  return ANALYTICS_PERIODS.includes(value as AnalyticsPeriod) ? (value as AnalyticsPeriod) : DEFAULT_PERIOD;
}

// A RPC espera p_days: number para janelas fechadas, null para "total".
export function periodToDays(period: AnalyticsPeriod): number | null {
  return period === "total" ? null : Number(period);
}

// Taxa de interesse = cliques no WhatsApp / visualizações do produto (em %).
// Espelha o cálculo da RPC (PLAN.md seção 5) e é usada nos totais gerais,
// que a RPC de ranking não cobre.
export function interestRate(views: number, clicks: number): number {
  if (views <= 0) return 0;
  return Math.round((100 * clicks) / views * 100) / 100;
}

export type ProductRanking = {
  product_id: string;
  product_name: string;
  views: number;
  clicks: number;
  interest_rate: number;
};

export type CategoryRanking = { category_id: string; category_name: string; views: number };
export type CollectionRanking = { collection_id: string; collection_name: string; views: number };

export type AnalyticsTotals = {
  productViews: number;
  whatsappClicks: number;
  categoryViews: number;
  collectionViews: number;
  interestRate: number;
};

function periodStart(period: AnalyticsPeriod): string | null {
  const days = periodToDays(period);
  if (days === null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getProductRankings(storeId: string, period: AnalyticsPeriod): Promise<ProductRanking[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_product_rankings", {
    p_store_id: storeId,
    p_days: periodToDays(period),
  });

  if (error) {
    console.warn("[analytics] get_product_rankings", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCategoryRankings(storeId: string, period: AnalyticsPeriod): Promise<CategoryRanking[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_category_rankings", {
    p_store_id: storeId,
    p_days: periodToDays(period),
  });

  if (error) {
    console.warn("[analytics] get_category_rankings", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCollectionRankings(storeId: string, period: AnalyticsPeriod): Promise<CollectionRanking[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_collection_rankings", {
    p_store_id: storeId,
    p_days: periodToDays(period),
  });

  if (error) {
    console.warn("[analytics] get_collection_rankings", error.message);
    return [];
  }
  return data ?? [];
}

// Totais por tipo de evento: uma contagem `head` por tipo (4 roundtrips leves,
// sem trazer linha alguma) em vez de buscar os eventos brutos no client.
export async function getAnalyticsTotals(storeId: string, period: AnalyticsPeriod): Promise<AnalyticsTotals> {
  const supabase = await createServerSupabaseClient();
  const since = periodStart(period);

  const countEvents = async (eventType: AnalyticsEventType) => {
    let query = supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("event_type", eventType);

    if (since) query = query.gte("created_at", since);

    const { count, error } = await query;
    if (error) {
      console.warn(`[analytics] contagem de ${eventType}`, error.message);
      return 0;
    }
    return count ?? 0;
  };

  const [productViews, whatsappClicks, categoryViews, collectionViews] = await Promise.all([
    countEvents("product_view"),
    countEvents("whatsapp_click"),
    countEvents("category_view"),
    countEvents("collection_view"),
  ]);

  return {
    productViews,
    whatsappClicks,
    categoryViews,
    collectionViews,
    interestRate: interestRate(productViews, whatsappClicks),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_PAGE_SIZE = 1000;
const SERIES_MAX_PAGES = 10;

export type DailySeries = {
  views: DailyPoint[];
  clicks: DailyPoint[];
  /** true quando havia mais eventos que o limite de leitura (o gráfico mostra só uma parte). */
  truncated: boolean;
};

// Evolução por dia de visualizações e cliques no WhatsApp. Só para janelas fechadas (7/30/90
// dias): "todo o período" não tem um número de barras razoável. Lê só horário e tipo dos
// eventos do próprio dono (mesma RLS dos totais), em páginas de 1000, com teto de 10 mil.
export async function getDailySeries(storeId: string, period: AnalyticsPeriod): Promise<DailySeries | null> {
  const days = periodToDays(period);
  if (days === null) return null;

  const supabase = await createServerSupabaseClient();
  // Janela com folga de um dia: o corte é refinado ao agrupar por dia no fuso da loja.
  const since = new Date(Date.now() - (days + 1) * DAY_MS).toISOString();

  const viewTimes: string[] = [];
  const clickTimes: string[] = [];
  let truncated = false;

  for (let page = 0; page < SERIES_MAX_PAGES; page += 1) {
    const from = page * SERIES_PAGE_SIZE;
    const { data, error } = await supabase
      .from("analytics_events")
      .select("created_at, event_type")
      .eq("store_id", storeId)
      .in("event_type", ["product_view", "whatsapp_click"])
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + SERIES_PAGE_SIZE - 1);

    if (error) {
      console.warn("[analytics] série diária", error.message);
      return null;
    }

    for (const event of data ?? []) {
      (event.event_type === "product_view" ? viewTimes : clickTimes).push(event.created_at);
    }

    if ((data?.length ?? 0) < SERIES_PAGE_SIZE) break;
    if (page === SERIES_MAX_PAGES - 1) truncated = true;
  }

  return {
    views: buildDailySeries(viewTimes, days),
    clicks: buildDailySeries(clickTimes, days),
    truncated,
  };
}

// Visualizações e cliques do período imediatamente anterior (mesmo tamanho), para a tendência.
export async function getPreviousPeriodTotals(
  storeId: string,
  period: AnalyticsPeriod,
): Promise<{ productViews: number; whatsappClicks: number } | null> {
  const days = periodToDays(period);
  if (days === null) return null;

  const supabase = await createServerSupabaseClient();
  const end = new Date(Date.now() - days * DAY_MS).toISOString();
  const start = new Date(Date.now() - 2 * days * DAY_MS).toISOString();

  const count = async (eventType: AnalyticsEventType) => {
    const { count: total, error } = await supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("event_type", eventType)
      .gte("created_at", start)
      .lt("created_at", end);
    if (error) {
      console.warn(`[analytics] período anterior de ${eventType}`, error.message);
      return 0;
    }
    return total ?? 0;
  };

  const [productViews, whatsappClicks] = await Promise.all([count("product_view"), count("whatsapp_click")]);
  return { productViews, whatsappClicks };
}
