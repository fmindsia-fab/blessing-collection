import { startCheckout, openBillingPortal } from "@/lib/stripe/actions";
import { Button } from "@/components/ui/button";
import type { SubscriptionStatus } from "@/types/database.types";

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Em período de teste",
  active: "Ativa",
  past_due: "Pagamento em atraso",
  canceled: "Cancelada",
  expired: "Período gratuito encerrado",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export type BillingSectionProps = {
  status: SubscriptionStatus | null;
  billingType: string | null;
  hasCustomer: boolean;
  hasStripeSubscription: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  planPriceLabel: string | null;
};

export function BillingSection({
  status,
  billingType,
  hasCustomer,
  hasStripeSubscription,
  trialEndsAt,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  cancelAt,
  planPriceLabel,
}: BillingSectionProps) {
  // Cortesia (ex.: cliente sem cobrança): nada a pagar nem a gerenciar.
  if (billingType === "complimentary") {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tracking-tight">Assinatura</span>
        <span className="text-xs text-muted-foreground">Plano cortesia: sem cobrança.</span>
      </div>
    );
  }

  // Com assinatura viva no Stripe (ativa, atrasada ou em teste do Stripe) o
  // caminho é o portal; sem ela (teste próprio, expirado, cancelada) é assinar.
  const managedByStripe = hasStripeSubscription && (status === "active" || status === "past_due" || status === "trialing");

  const details: string[] = [];
  // Cancelamento agendado vale para assinatura ativa OU ainda no teste do Stripe:
  // nos dois casos não haverá nova cobrança, e a data de fim vem do Stripe.
  const cancelScheduled = managedByStripe && cancelAtPeriodEnd && (status === "active" || status === "trialing");
  const accessUntil = cancelAt ?? (status === "trialing" ? trialEndsAt : currentPeriodEnd);

  if (cancelScheduled && accessUntil) {
    details.push(
      status === "trialing"
        ? `Cancelamento agendado: você pode usar até ${formatDate(accessUntil)} e não será cobrado.`
        : `Cancelamento agendado: o acesso vai até ${formatDate(accessUntil)}.`,
    );
    details.push("Para continuar, abra \"Gerenciar assinatura\" e desfaça o cancelamento.");
  } else {
    if (status === "trialing" && trialEndsAt) {
      details.push(
        managedByStripe
          ? `Assinatura confirmada. A primeira cobrança será em ${formatDate(trialEndsAt)}.`
          : `Teste grátis até ${formatDate(trialEndsAt)}.`,
      );
    }
    if (status === "active" && currentPeriodEnd) {
      details.push(`Próxima renovação em ${formatDate(currentPeriodEnd)}.`);
    }
  }
  if (status === "past_due") {
    details.push("Não conseguimos cobrar a sua assinatura. Atualize a forma de pagamento para manter o catálogo no ar.");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tracking-tight">Assinatura</span>
        <span className="text-xs text-muted-foreground">
          {status ? STATUS_LABEL[status] : "Nenhuma assinatura iniciada"}
          {planPriceLabel ? ` · Plano mensal ${planPriceLabel}` : ""}
        </span>
        {details.map((text) => (
          <span key={text} className="text-xs text-muted-foreground">
            {text}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {managedByStripe ? null : (
          <form action={startCheckout}>
            <Button type="submit" className="w-fit">
              {status === "canceled" || status === "expired" ? "Assinar novamente" : "Assinar agora"}
            </Button>
          </form>
        )}
        {hasCustomer ? (
          <form action={openBillingPortal}>
            <Button type="submit" variant={managedByStripe ? "default" : "outline"} className="w-fit">
              {status === "past_due" ? "Atualizar forma de pagamento" : "Gerenciar assinatura"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
