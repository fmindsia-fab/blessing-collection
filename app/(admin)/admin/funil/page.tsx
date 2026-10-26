import Link from "next/link";
import { BellRingIcon, FunnelIcon, HandshakeIcon, TrendingUpIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listLeads, type LeadRow } from "@/lib/leads/queries";
import { todayInStoreZone } from "@/lib/finance/queries";
import { LEAD_STAGES, followupStatus, isOpenStage, nextStage, sourceLabel, stageLabel, summarizeFunnel } from "@/lib/leads/calc";
import { formatDateBR, formatMoney } from "@/lib/stock/format";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { StatusPill } from "@/components/admin/status-pill";
import { ActionLink } from "@/components/ui/action";
import { cn } from "@/lib/utils";
import { AdvanceButton } from "./advance-button";

function LeadCard({ lead, today }: { lead: LeadRow; today: string }) {
  const followup = isOpenStage(lead.stage) ? followupStatus(lead.nextFollowup, today) : "none";
  const next = nextStage(lead.stage);

  return (
    <li className={cn("flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm", followup === "overdue" ? "border-destructive/50" : "border-border")}>
      <Link href={`/admin/funil/${lead.id}`} className="flex flex-col gap-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">
        <span className="break-words text-base font-semibold">{lead.name}</span>
        <span className="text-sm text-muted-foreground">
          {sourceLabel(lead.source)}
          {lead.interest ? ` · ${lead.interest}` : ""}
        </span>
        {lead.stage === "lost" && lead.lostReason ? <span className="text-sm text-muted-foreground">Motivo: {lead.lostReason}</span> : null}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {lead.estimatedValue > 0 ? <span className="text-sm font-semibold tabular-nums">{formatMoney(lead.estimatedValue)}</span> : null}
        {followup === "overdue" ? (
          <StatusPill tone="accent" className="border-destructive/50 text-destructive">
            Retorno atrasado
          </StatusPill>
        ) : null}
        {followup === "today" ? <StatusPill tone="accent">Retornar hoje</StatusPill> : null}
        {followup === "upcoming" && lead.nextFollowup ? <StatusPill tone="neutral">Retorno {formatDateBR(lead.nextFollowup)}</StatusPill> : null}
      </div>
      {next ? <AdvanceButton leadId={lead.id} nextStage={next} label={stageLabel(next)} /> : null}
    </li>
  );
}

function StageColumn({ stage, leads, today, note }: { stage: (typeof LEAD_STAGES)[number]; leads: LeadRow[]; today: string; note: string }) {
  return (
    <PageSection id={`etapa-${stage.value}`}>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">
        {stage.label} <span className="text-muted-foreground">({leads.length})</span>
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{note}</p>
      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém aqui.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} today={today} />
          ))}
        </ul>
      )}
    </PageSection>
  );
}

export default async function FunnelPage() {
  const store = await getActiveStore();
  const today = todayInStoreZone();
  const leads = await listLeads(store.id);
  const summary = summarizeFunnel(
    leads.map((lead) => ({ stage: lead.stage, estimatedValue: lead.estimatedValue, nextFollowup: lead.nextFollowup, lostReason: lead.lostReason })),
    today,
  );
  const inProgress = summary.counts.new + summary.counts.talking + summary.counts.quoted;

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeading
        kicker="Vendas"
        title="Funil de vendas"
        description="Quem está interessado, em que ponto está a conversa e quando voltar a falar."
        action={
          <ActionLink href="/admin/funil/novo" variant="solid" className="h-11 px-6" data-help="new-lead">
            Novo contato
          </ActionLink>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          icon={FunnelIcon}
          action={
            <ActionLink href="/admin/funil/novo" variant="outline" className="h-11 px-6">
              Anotar o primeiro contato
            </ActionLink>
          }
        >
          Nenhum contato ainda. Anote quem chamou no WhatsApp ou no Instagram e acompanhe até virar pedido.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Em andamento" value={String(inProgress)} icon={HandshakeIcon} hint={inProgress === 1 ? "contato aberto" : "contatos abertos"} />
            <StatCard label="Valor em negociação" value={formatMoney(summary.openValue)} icon={TrendingUpIcon} hint="Soma do valor estimado dos abertos." />
            <StatCard
              label="Retornos"
              value={String(summary.followupsToday + summary.followupsOverdue)}
              icon={BellRingIcon}
              hint={`${summary.followupsToday} hoje · ${summary.followupsOverdue} atrasados`}
            />
            <StatCard
              label="Taxa de fechamento"
              value={summary.closeRate === null ? "—" : `${summary.closeRate}%`}
              icon={FunnelIcon}
              hint={
                summary.closeRate === null
                  ? "Aparece quando houver contatos fechados ou perdidos."
                  : `${summary.counts.won} fechados · ${summary.counts.lost} perdidos`
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {LEAD_STAGES.slice(0, 3).map((stage) => (
              <StageColumn key={stage.value} stage={stage} leads={leads.filter((lead) => lead.stage === stage.value)} today={today} note={stage.hint} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {LEAD_STAGES.slice(3).map((stage) => (
              <StageColumn key={stage.value} stage={stage} leads={leads.filter((lead) => lead.stage === stage.value)} today={today} note="Últimos 90 dias." />
            ))}
          </div>

          {summary.lostReasons.length > 0 ? (
            <PageSection id="motivos" title="Por que não fechou">
              <ul className="flex flex-col divide-y divide-border/70">
                {summary.lostReasons.map((item) => (
                  <li key={item.reason} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-base">{item.reason}</span>
                    <span className="text-base font-semibold tabular-nums">{item.count}</span>
                  </li>
                ))}
              </ul>
            </PageSection>
          ) : null}
        </>
      )}
    </div>
  );
}
