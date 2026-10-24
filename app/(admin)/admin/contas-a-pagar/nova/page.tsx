import { todayInStoreZone } from "@/lib/finance/queries";
import { BackLink } from "@/components/shared/back-link";
import { PageHeading } from "@/components/admin/page-heading";
import { PayableForm } from "./payable-form";

export default function NewPayablePage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink href="/admin/contas-a-pagar">Contas a pagar</BackLink>
      <PageHeading
        kicker="Financeiro"
        title="Nova conta a pagar"
        description="Anote uma conta e quando ela vence. Compras de materiais a prazo já geram as contas sozinhas."
      />
      <PayableForm today={todayInStoreZone()} />
    </div>
  );
}
