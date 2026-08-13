import { getActiveStore } from "@/lib/store/get-active-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listAllPaymentMethodsForAdmin } from "@/lib/pricing/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { LaborForm } from "./labor-form";
import { PaymentMethods } from "./payment-methods";

export default async function PricingSettingsPage() {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const [{ data: settings }, methods] = await Promise.all([
    supabase
      .from("stores")
      .select(
        "monthly_pay, monthly_fixed_cost, productive_hours_per_month, tax_regime, tax_percent, default_pricing_method, default_margin_percent",
      )
      .eq("id", store.id)
      .single(),
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
        {settings ? <LaborForm settings={settings} /> : null}
      </section>

      <section className="flex flex-col gap-5 rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-brand)] text-xl">Formas de pagamento</h2>
        <PaymentMethods methods={methods} />
      </section>
    </div>
  );
}
