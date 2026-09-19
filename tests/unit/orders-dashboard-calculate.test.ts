import { describe, expect, it } from "vitest";
import {
  calculateFinancialSummary,
  calculateStatusBreakdown,
  calculateTopEntries,
} from "@/lib/orders/dashboard-calculate";

describe("calculateFinancialSummary", () => {
  it("soma sinal e saldo pagos como recebido, o resto (do total) como a receber", () => {
    const result = calculateFinancialSummary([
      {
        status: "confirmed",
        totalAmount: 150,
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
      {
        status: "cancelled",
        totalAmount: 150,
        depositAmount: 50,
        depositPaidAt: null,
        balanceAmount: 100,
        balancePaidAt: null,
      },
      {
        status: "confirmed",
        totalAmount: 20,
        depositAmount: 20,
        depositPaidAt: "2026-09-01",
        balanceAmount: 0,
        balancePaidAt: null,
      },
    ]);

    expect(result.received).toBe(20);
    expect(result.pending).toBe(0);
  });

  it("calcula ticket medio sobre total_amount dos pedidos nao cancelados", () => {
    const result = calculateFinancialSummary([
      { status: "confirmed", totalAmount: 100, depositAmount: 50, depositPaidAt: null, balanceAmount: 50, balancePaidAt: null },
      { status: "confirmed", totalAmount: 200, depositAmount: 100, depositPaidAt: null, balanceAmount: 100, balancePaidAt: null },
      { status: "cancelled", totalAmount: 999, depositAmount: 999, depositPaidAt: null, balanceAmount: 999, balancePaidAt: null },
    ]);

    // (100 + 200) / 2 pedidos não cancelados
    expect(result.averageTicket).toBe(150);
  });

  it("sem pedidos retorna zeros, sem dividir por zero", () => {
    const result = calculateFinancialSummary([]);
    expect(result).toEqual({ received: 0, pending: 0, averageTicket: 0 });
  });

  // Bug real: sinal+saldo preenchidos sem cobrir o total do pedido faziam
  // "recebido"/"ticket médio" divergirem de "pedidos por status" (que usa
  // total_amount) — total_amount é sempre a referência, nunca sinal+saldo.
  it("total_amount é sempre a referência: sinal+saldo abaixo do total não infla nem diverge", () => {
    const result = calculateFinancialSummary([
      {
        status: "confirmed",
        totalAmount: 289.7,
        depositAmount: 0,
        depositPaidAt: null,
        balanceAmount: 0,
        balancePaidAt: null,
      },
      {
        status: "ready",
        totalAmount: 749.7,
        depositAmount: 0,
        depositPaidAt: null,
        balanceAmount: 0,
        balancePaidAt: null,
      },
    ]);

    // total_amount somado é a referência de "pedidos por status" — o
    // financeiro (recebido+a receber) precisa bater com essa mesma soma.
    expect(result.received + result.pending).toBeCloseTo(289.7 + 749.7);
  });

  it("pago maior que o total do pedido (erro de digitação) não deixa 'a receber' negativo", () => {
    const result = calculateFinancialSummary([
      {
        status: "confirmed",
        totalAmount: 100,
        depositAmount: 200,
        depositPaidAt: "2026-09-01",
        balanceAmount: 0,
        balancePaidAt: null,
      },
    ]);

    expect(result.received).toBe(100);
    expect(result.pending).toBe(0);
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
