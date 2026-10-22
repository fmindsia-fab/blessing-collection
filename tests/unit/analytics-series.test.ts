import { describe, expect, it } from "vitest";
import { buildDailySeries, calculateTrend } from "@/lib/analytics/series";

describe("buildDailySeries", () => {
  // 15/10/2026 12:00 em Brasília (UTC-3) = 15:00 UTC.
  const now = new Date("2026-10-15T15:00:00Z");

  it("gera um ponto por dia, com zero nos dias sem evento", () => {
    const series = buildDailySeries(["2026-10-15T14:00:00Z", "2026-10-15T10:00:00Z", "2026-10-13T12:00:00Z"], 3, now);
    expect(series).toEqual([
      { date: "2026-10-13", count: 1 },
      { date: "2026-10-14", count: 0 },
      { date: "2026-10-15", count: 2 },
    ]);
  });

  it("conta o dia no horário de Brasília, não em UTC", () => {
    // 01:00 UTC de 16/10 ainda é 22:00 de 15/10 em Brasília.
    const series = buildDailySeries(["2026-10-16T01:00:00Z"], 2, now);
    expect(series[1]).toEqual({ date: "2026-10-15", count: 1 });
  });

  it("ignora eventos fora da janela", () => {
    const series = buildDailySeries(["2026-09-01T12:00:00Z"], 7, now);
    expect(series.every((point) => point.count === 0)).toBe(true);
    expect(series).toHaveLength(7);
  });
});

describe("calculateTrend", () => {
  it("calcula alta, queda e estabilidade", () => {
    expect(calculateTrend(120, 100)).toEqual({ direction: "up", percent: 20 });
    expect(calculateTrend(50, 100)).toEqual({ direction: "down", percent: 50 });
    expect(calculateTrend(100, 100)).toEqual({ direction: "flat", percent: 0 });
  });

  it("não inventa tendência quando o período anterior foi zero", () => {
    expect(calculateTrend(10, 0)).toBeNull();
    expect(calculateTrend(0, 0)).toBeNull();
  });
});
