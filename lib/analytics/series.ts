// Funções puras para o gráfico de evolução e as tendências do Dashboard.
// Trabalham só com os horários dos eventos que já existem em analytics_events.

export type DailyPoint = { date: string; count: number };

// Dia (AAAA-MM-DD) de um instante no fuso da loja. O padrão é o horário de Brasília.
export const STORE_TIME_ZONE = "America/Sao_Paulo";

function dayKey(date: Date, timeZone: string): string {
  // "en-CA" formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/**
 * Uma barra por dia, dos últimos `days` dias (terminando hoje), com zero nos dias sem evento.
 * Eventos fora dessa janela são ignorados.
 */
export function buildDailySeries(
  timestamps: string[],
  days: number,
  now: Date = new Date(),
  timeZone: string = STORE_TIME_ZONE,
): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const timestamp of timestamps) {
    const key = dayKey(new Date(timestamp), timeZone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: DailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    // Recua em blocos de 24 h a partir de agora; o dia é lido no fuso da loja.
    const key = dayKey(new Date(now.getTime() - offset * 24 * 60 * 60 * 1000), timeZone);
    points.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return points;
}

export type Trend = { direction: "up" | "down" | "flat"; percent: number };

/**
 * Variação contra o período anterior. Sem base de comparação (anterior = 0) não há tendência
 * honesta para mostrar, então devolve null em vez de inventar um percentual.
 */
export function calculateTrend(current: number, previous: number): Trend | null {
  if (previous <= 0) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { direction: "flat", percent: 0 };
  return { direction: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
}
