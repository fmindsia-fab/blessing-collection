import { describe, expect, it } from "vitest";
import {
  addDays,
  cashBalance,
  lastMonths,
  monthlyCashFlow,
  payableStatus,
  projectCash,
  summarizePayables,
} from "@/lib/finance/calc";
import { cashIncomeSchema, payableSchema, purchasePaymentSchema } from "@/lib/finance/schema";

const TODAY = "2026-10-24";

describe("datas", () => {
  it("soma dias atravessando mês e ano", () => {
    expect(addDays("2026-10-24", 7)).toBe("2026-10-31");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-10-24", -60)).toBe("2026-08-25");
  });

  it("lista os últimos meses do mais antigo para o atual", () => {
    expect(lastMonths("2026-02-10", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("contas a pagar", () => {
  it("classifica em paga, vencida, de hoje e a vencer", () => {
    expect(payableStatus({ dueDate: "2026-10-01", amount: 10, paidAt: "2026-10-02" }, TODAY)).toBe("paid");
    expect(payableStatus({ dueDate: "2026-10-23", amount: 10, paidAt: null }, TODAY)).toBe("overdue");
    expect(payableStatus({ dueDate: TODAY, amount: 10, paidAt: null }, TODAY)).toBe("today");
    expect(payableStatus({ dueDate: "2026-10-25", amount: 10, paidAt: null }, TODAY)).toBe("upcoming");
  });

  it("resume vencidas, hoje e próximos 7 dias, ignorando as pagas", () => {
    const summary = summarizePayables(
      [
        { dueDate: "2026-10-20", amount: 50.5, paidAt: null },
        { dueDate: "2026-10-22", amount: 10, paidAt: null },
        { dueDate: TODAY, amount: 30, paidAt: null },
        { dueDate: "2026-10-31", amount: 20, paidAt: null },
        { dueDate: "2026-11-01", amount: 99, paidAt: null },
        { dueDate: "2026-10-10", amount: 500, paidAt: "2026-10-11" },
      ],
      TODAY,
    );

    expect(summary.overdue).toEqual({ count: 2, total: 60.5 });
    expect(summary.today).toEqual({ count: 1, total: 30 });
    expect(summary.nextWeek).toEqual({ count: 1, total: 20 });
    expect(summary.open).toEqual({ count: 5, total: 209.5 });
  });
});

describe("fluxo de caixa", () => {
  it("agrupa entradas e saídas pelo mês da data de pagamento", () => {
    const flow = monthlyCashFlow(
      [
        { date: "2026-09-10", amount: 100 },
        { date: "2026-10-02", amount: 250.25 },
        { date: "2026-10-20", amount: 49.75 },
      ],
      [{ date: "2026-10-05", amount: 80 }],
      ["2026-09", "2026-10"],
    );

    expect(flow).toEqual([
      { month: "2026-09", income: 100, expense: 0, balance: 100 },
      { month: "2026-10", income: 300, expense: 80, balance: 220 },
    ]);
  });

  it("saldo = inicial + entradas - saídas, só a partir da data do saldo inicial e até hoje", () => {
    const balance = cashBalance(
      { amount: 1000, date: "2026-10-01" },
      [
        { date: "2026-09-15", amount: 700 },
        { date: "2026-10-03", amount: 300 },
        { date: "2026-10-30", amount: 900 },
      ],
      [
        { date: "2026-09-20", amount: 200 },
        { date: "2026-10-10", amount: 150 },
      ],
      TODAY,
    );

    expect(balance).toBe(1150);
  });

  it("sem data do saldo inicial conta tudo até hoje", () => {
    expect(cashBalance({ amount: 0, date: null }, [{ date: "2026-01-01", amount: 40 }], [{ date: "2026-02-01", amount: 15 }], TODAY)).toBe(25);
  });
});

describe("projeção de caixa", () => {
  it("projeta 30/60/90 dias com o a receber e o a pagar, e avisa do que não tem data", () => {
    const projection = projectCash({
      balance: 1000,
      today: TODAY,
      receivables: [
        { date: "2026-10-30", amount: 400 },
        { date: "2026-12-10", amount: 600 },
        { date: "2026-10-01", amount: 100 },
        { date: null, amount: 250 },
      ],
      payables: [
        { dueDate: "2026-10-15", amount: 70 },
        { dueDate: "2026-11-20", amount: 300 },
        { dueDate: "2027-03-01", amount: 999 },
      ],
    });

    expect(projection.undatedReceivable).toBe(250);
    expect(projection.steps).toEqual([
      { days: 30, inflow: 500, outflow: 370, balance: 1130 },
      { days: 60, inflow: 1100, outflow: 370, balance: 1730 },
      { days: 90, inflow: 1100, outflow: 370, balance: 1730 },
    ]);
  });
});

describe("validação dos lançamentos", () => {
  it("aceita uma conta válida e recusa valor zero", () => {
    const base = { description: "Caixas", category: "packaging", dueDate: "2026-11-05", amount: "35.90", recurrence: "monthly" };
    expect(payableSchema.safeParse(base).success).toBe(true);
    expect(payableSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(payableSchema.safeParse({ ...base, category: "invalida" }).success).toBe(false);
    expect(payableSchema.safeParse({ ...base, dueDate: "05/11/2026" }).success).toBe(false);
  });

  it("exige descrição e data na entrada avulsa", () => {
    expect(cashIncomeSchema.safeParse({ description: "Feira", amount: "120", receivedAt: "2026-10-20" }).success).toBe(true);
    expect(cashIncomeSchema.safeParse({ description: " ", amount: "120", receivedAt: "2026-10-20" }).success).toBe(false);
  });

  it("compra a prazo exige o vencimento da primeira parcela e limita a 24", () => {
    expect(purchasePaymentSchema.safeParse({ mode: "paid" }).success).toBe(true);
    expect(purchasePaymentSchema.safeParse({ mode: "later", installments: 3 }).success).toBe(false);
    expect(purchasePaymentSchema.safeParse({ mode: "later", firstDue: "2026-11-10", installments: 3 }).success).toBe(true);
    expect(purchasePaymentSchema.safeParse({ mode: "later", firstDue: "2026-11-10", installments: 25 }).success).toBe(false);
  });
});
