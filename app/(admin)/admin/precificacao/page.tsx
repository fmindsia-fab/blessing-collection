import { getActiveStore } from "@/lib/store/get-active-store";
import { getStorePrivate } from "@/lib/store/private";
import { listAllPaymentMethodsForAdmin } from "@/lib/pricing/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { LaborForm } from "./labor-form";
import { PaymentMethods } from "./payment-methods";

export default async function PricingSettingsPage() {
  const store = await getActiveStore();

  const [settings, methods] = await Promise.all([
    // Dado privado (store_private); loja sem linha ainda usa os padrões.
    getStorePrivate(store.id),
    listAllPaymentMethodsForAdmin(store.id),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <PageHeading
        kicker="Financeiro"
        title="Precificação"
        description="Estes valores alimentam a sugestão de preço de cada peça."
      />

      <section className="rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <LaborForm settings={settings} />
      </section>

      <section className="flex flex-col gap-5 rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-xl">Formas de pagamento</h2>
        <PaymentMethods methods={methods} />
      </section>
    </div>
  );
}
