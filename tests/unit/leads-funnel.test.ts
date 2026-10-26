import { describe, expect, it } from "vitest";
import { followupStatus, nextStage, phoneDigits, summarizeFunnel } from "@/lib/leads/calc";
import { leadSchema, stageSchema } from "@/lib/leads/schema";

const TODAY = "2026-10-26";

describe("funil: etapas e retornos", () => {
  it("avança só pelo caminho normal", () => {
    expect(nextStage("new")).toBe("talking");
    expect(nextStage("talking")).toBe("quoted");
    expect(nextStage("quoted")).toBe("won");
    expect(nextStage("won")).toBeNull();
    expect(nextStage("lost")).toBeNull();
  });

  it("classifica o retorno em atrasado, hoje, futuro ou sem data", () => {
    expect(followupStatus("2026-10-25", TODAY)).toBe("overdue");
    expect(followupStatus(TODAY, TODAY)).toBe("today");
    expect(followupStatus("2026-10-27", TODAY)).toBe("upcoming");
    expect(followupStatus(null, TODAY)).toBe("none");
  });

  it("compara telefones só pelos dígitos", () => {
    expect(phoneDigits("(11) 98888-7777")).toBe("11988887777");
    expect(phoneDigits(null)).toBe("");
  });
});

describe("funil: resumo", () => {
  it("conta etapas, valor em aberto, retornos, taxa de fechamento e motivos de perda", () => {
    const summary = summarizeFunnel(
      [
        { stage: "new", estimatedValue: 100, nextFollowup: TODAY, lostReason: null },
        { stage: "talking", estimatedValue: 250.5, nextFollowup: "2026-10-20", lostReason: null },
        { stage: "quoted", estimatedValue: 50, nextFollowup: null, lostReason: null },
        { stage: "won", estimatedValue: 900, nextFollowup: "2026-10-01", lostReason: null },
        { stage: "lost", estimatedValue: 300, nextFollowup: null, lostReason: "Preço" },
        { stage: "lost", estimatedValue: 80, nextFollowup: null, lostReason: " preço " },
        { stage: "lost", estimatedValue: 0, nextFollowup: null, lostReason: null },
      ],
      TODAY,
    );

    expect(summary.counts).toEqual({ new: 1, talking: 1, quoted: 1, won: 1, lost: 3 });
    expect(summary.openValue).toBe(400.5);
    expect(summary.followupsToday).toBe(1);
    expect(summary.followupsOverdue).toBe(1);
    expect(summary.closeRate).toBe(25);
    expect(summary.lostReasons[0]).toEqual({ reason: "Preço", count: 2 });
    expect(summary.lostReasons[1].reason).toBe("Sem motivo informado");
  });

  it("sem decisões a taxa de fechamento fica em branco", () => {
    expect(summarizeFunnel([{ stage: "new", estimatedValue: 0, nextFollowup: null, lostReason: null }], TODAY).closeRate).toBeNull();
  });
});

describe("funil: validação", () => {
  it("aceita um contato mínimo e converte o valor com vírgula", () => {
    const parsed = leadSchema.safeParse({ name: " Mariana ", phone: "", source: "whatsapp", interest: "", estimatedValue: "150,50", nextFollowup: "", notes: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Mariana");
      expect(parsed.data.estimatedValue).toBe(150.5);
      expect(parsed.data.phone).toBeUndefined();
    }
  });

  it("recusa nome vazio, origem inválida e etapa inválida", () => {
    expect(leadSchema.safeParse({ name: " ", source: "whatsapp", estimatedValue: "0" }).success).toBe(false);
    expect(leadSchema.safeParse({ name: "Ana", source: "tv", estimatedValue: "0" }).success).toBe(false);
    expect(stageSchema.safeParse({ stage: "ganho" }).success).toBe(false);
    expect(stageSchema.safeParse({ stage: "lost", lostReason: "Preço" }).success).toBe(true);
  });
});
