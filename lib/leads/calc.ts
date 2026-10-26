import type { LeadSource, LeadStage } from "@/types/database.types";

// Regras puras do funil de vendas: etapas, resumo, retornos e motivos de perda.

export const LEAD_STAGES: { value: LeadStage; label: string; hint: string }[] = [
  { value: "new", label: "Novo contato", hint: "Acabou de chegar" },
  { value: "talking", label: "Conversando", hint: "Em conversa" },
  { value: "quoted", label: "Orçamento enviado", hint: "Esperando resposta" },
  { value: "won", label: "Fechado", hint: "Virou venda" },
  { value: "lost", label: "Perdido", hint: "Não fechou" },
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Indicação" },
  { value: "fair", label: "Feira" },
  { value: "website", label: "Catálogo" },
  { value: "other", label: "Outro" },
];

export const LOST_REASON_SUGGESTIONS = ["Preço", "Prazo", "Sem resposta", "Escolheu outra loja", "Desistiu"];

export function stageLabel(stage: LeadStage): string {
  return LEAD_STAGES.find((item) => item.value === stage)?.label ?? stage;
}

export function sourceLabel(source: LeadSource): string {
  return LEAD_SOURCES.find((item) => item.value === source)?.label ?? "Outro";
}

/** Contato ainda em andamento (nem fechado, nem perdido). */
export function isOpenStage(stage: LeadStage): boolean {
  return stage === "new" || stage === "talking" || stage === "quoted";
}

/** Próxima etapa do caminho normal; fechado e perdido não avançam. */
export function nextStage(stage: LeadStage): LeadStage | null {
  if (stage === "new") return "talking";
  if (stage === "talking") return "quoted";
  if (stage === "quoted") return "won";
  return null;
}

export type FollowupStatus = "overdue" | "today" | "upcoming" | "none";

export function followupStatus(nextFollowup: string | null, today: string): FollowupStatus {
  if (!nextFollowup) return "none";
  if (nextFollowup < today) return "overdue";
  if (nextFollowup === today) return "today";
  return "upcoming";
}

export type LeadLike = {
  stage: LeadStage;
  estimatedValue: number;
  nextFollowup: string | null;
  lostReason: string | null;
};

export type FunnelSummary = {
  counts: Record<LeadStage, number>;
  /** Soma do valor estimado dos contatos ainda em andamento. */
  openValue: number;
  /** Fechados / (fechados + perdidos), em %; null enquanto nenhum contato foi decidido. */
  closeRate: number | null;
  followupsToday: number;
  followupsOverdue: number;
  /** Motivos de perda mais citados (agrupados sem diferenciar maiúsculas), do mais para o menos. */
  lostReasons: { reason: string; count: number }[];
};

export function summarizeFunnel(leads: LeadLike[], today: string): FunnelSummary {
  const counts: Record<LeadStage, number> = { new: 0, talking: 0, quoted: 0, won: 0, lost: 0 };
  let openValue = 0;
  let followupsToday = 0;
  let followupsOverdue = 0;
  const reasons = new Map<string, { reason: string; count: number }>();

  for (const lead of leads) {
    counts[lead.stage] += 1;

    if (isOpenStage(lead.stage)) {
      openValue += lead.estimatedValue;
      const status = followupStatus(lead.nextFollowup, today);
      if (status === "today") followupsToday += 1;
      if (status === "overdue") followupsOverdue += 1;
    }

    if (lead.stage === "lost") {
      const reason = (lead.lostReason ?? "").trim();
      const key = reason.toLocaleLowerCase("pt-BR") || "sem motivo";
      const entry = reasons.get(key) ?? { reason: reason || "Sem motivo informado", count: 0 };
      entry.count += 1;
      reasons.set(key, entry);
    }
  }

  const decided = counts.won + counts.lost;

  return {
    counts,
    openValue: Math.round(openValue * 100) / 100,
    closeRate: decided === 0 ? null : Math.round((counts.won / decided) * 100),
    followupsToday,
    followupsOverdue,
    lostReasons: [...reasons.values()].sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason, "pt-BR")),
  };
}

/** Só os dígitos do telefone, para comparar cadastros ("(11) 98888-7777" = "11988887777"). */
export function phoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}
