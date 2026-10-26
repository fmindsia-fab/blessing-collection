import { todayInStoreZone } from "@/lib/finance/queries";
import { BackLink } from "@/components/shared/back-link";
import { PageHeading } from "@/components/admin/page-heading";
import { LeadForm } from "../lead-form";

export default function NewLeadPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink href="/admin/funil">Funil de vendas</BackLink>
      <PageHeading kicker="Vendas" title="Novo contato" description="Anote quem chamou e o que quer. Depois é só acompanhar até fechar." />
      <LeadForm today={todayInStoreZone()} />
    </div>
  );
}
