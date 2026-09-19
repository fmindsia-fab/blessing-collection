import { describe, expect, it } from "vitest";
import {
  calculateFinancialSummary,
  calculateStatusBreakdown,
  calculateTopEntries,
} from "@/lib/orders/dashboard-calculate";

describe("calculateFinancialSummary", () => {
  it("soma sinal e saldo pagos como recebido, o resto como a receber", () => {
    const result = calculateFinancialSummary([
      {
        status: "confirmed",
        depositAmount: 50,
        depositPaidAt: "2026-09-01",
        balanceAmount: 100,
        balancePaidAt: null,
      },
    ]);

    expect(result.received).toBe(50);
    expect(result.pending).toBe(100);
  });

  it("ignora pedido cancelado no recebido e a receber, mas nao trava a conta", () => {
    const result = calculateFinancialSummary([
      { status: "cancelled", depositAmount: 50, depositPaidAt: null, balanceAmount: 100, balancePaidAt: null },
      { status: "confirmed", depositAmount: 20, depositPaidAt: "2026-09-01", balanceAmount: 0, balancePaidAt: null },
    ]);

    expect(result.received).toBe(20);
    expect(result.pending).toBe(0);
  });

  it("calcula ticket medio sobre pedidos nao cancelados", () => {
    const result = calculateFinancialSummary([
      { status: "confirmed", depositAmount: 50, depositPaidAt: null, balanceAmount: 50, balancePaidAt: null },
      { status: "confirmed", depositAmount: 100, depositPaidAt: null, balanceAmount: 100, balancePaidAt: null },
      { status: "cancelled", depositAmount: 999, depositPaidAt: null, balanceAmount: 999, balancePaidAt: null },
    ]);

    // (100 + 200) / 2 pedidos não cancelados
    expect(result.averageTicket).toBe(150);
  });

  it("sem pedidos retorna zeros, sem dividir por zero", () => {
    const result = calculateFinancialSummary([]);
    expect(result).toEqual({ received: 0, pending: 0, averageTicket: 0 });
  });
});

describe("calculateStatusBreakdown", () => {
  it("agrega contagem e valor por status", () => {
    const result = calculateStatusBreakdown([
      { status: "quote", totalAmount: 100 },
      { status: "quote", totalAmount: 50 },
      { status: "confirmed", totalAmount: 200 },
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        { status: "quote", count: 2, totalAmount: 150 },
        { status: "confirmed", count: 1, totalAmount: 200 },
      ]),
    );
  });
});

describe("calculateTopEntries", () => {
  it("ordena por contagem de pedidos, desempate por valor total", () => {
    const result = calculateTopEntries([
      { key: "p1", label: "Bolsa A", amount: 100 },
      { key: "p1", label: "Bolsa A", amount: 100 },
      { key: "p2", label: "Bolsa B", amount: 500 },
    ]);

    expect(result[0]).toEqual({ key: "p1", label: "Bolsa A", count: 2, totalAmount: 200 });
    expect(result[1]).toEqual({ key: "p2", label: "Bolsa B", count: 1, totalAmount: 500 });
  });

  it("limita ao top N informado", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      key: `p${i}`,
      label: `Produto ${i}`,
      amount: 10,
    }));

    expect(calculateTopEntries(entries, 3)).toHaveLength(3);
  });
});
