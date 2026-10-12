import { startCheckout, openBillingPortal } from "@/lib/stripe/actions";
import { Button } from "@/components/ui/button";
import type { SubscriptionStatus } from "@/types/database.types";

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Em período de teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Pagamento não efetuado",
};

export function BillingSection({
  hasCustomer,
  status,
}: {
  hasCustomer: boolean;
  status: SubscriptionStatus | null;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Assinatura</span>
        <span className="text-xs text-muted-foreground">
          {status ? STATUS_LABEL[status] : "Nenhuma assinatura iniciada"}
        </span>
      </div>

      {hasCustomer ? (
        <form action={openBillingPortal}>
          <Button type="submit" variant="outline" className="w-fit">
            Gerenciar assinatura
          </Button>
        </form>
      ) : (
        <form action={startCheckout}>
          <Button type="submit" className="w-fit">
            Assinar agora
          </Button>
        </form>
      )}
    </div>
  );
}
