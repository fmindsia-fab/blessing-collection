import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listActiveCustomers } from "@/lib/customers/queries";
import { getLead } from "@/lib/leads/queries";
import { todayInStoreZone } from "@/lib/finance/queries";
import { stageLabel } from "@/lib/leads/calc";
import { BackLink } from "@/components/shared/back-link";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { LeadForm } from "../lead-form";
import { LeadActions, StageControl } from "./lead-controls";

function formatDateTimeBR(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const result = await getLead(store.id, id);
  if (!result) notFound();

  const { lead, events } = result;
  const customers = await listActiveCustomers(store.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink href="/admin/funil">Funil de vendas</BackLink>
      <PageHeading kicker="Contato" title={lead.name} />

      <PageSection id="etapa" title="Em que ponto está">
        <StageControl leadId={lead.id} stage={lead.stage} lostReason={lead.lostReason} />
      </PageSection>

      <PageSection id="acoes" title="O que fazer">
        <LeadActions leadId={lead.id} hasOrder={Boolean(lead.orderId)} />
      </PageSection>

      <LeadForm
        lead={lead}
        today={todayInStoreZone()}
        customers={customers.map((customer) => ({ id: customer.id, name: customer.name, phone: customer.phone }))}
      />

      <PageSection id="historico" title="Histórico">
        <ul className="flex flex-col divide-y divide-border/70">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm">
              <span className="text-base">
                {event.fromStage ? `${stageLabel(event.fromStage)} → ${stageLabel(event.toStage)}` : `Entrou no funil como ${stageLabel(event.toStage)}`}
              </span>
              <span className="text-muted-foreground">{formatDateTimeBR(event.createdAt)}</span>
            </li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
