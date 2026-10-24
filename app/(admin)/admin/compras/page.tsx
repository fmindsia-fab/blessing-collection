import Link from "next/link";
import { ReceiptTextIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listPurchases } from "@/lib/stock/queries";
import { formatDateBR, formatMoney } from "@/lib/stock/format";
import { PageHeading } from "@/components/admin/page-heading";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { ActionLink } from "@/components/ui/action";
import { cn } from "@/lib/utils";

export default async function PurchasesPage() {
  const store = await getActiveStore();
  const purchases = await listPurchases(store.id);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeading
        kicker="Estoque e compras"
        title="Compras de materiais"
        description="O histórico do que você comprou: quando, de quem e quanto pagou."
        action={
          <ActionLink href="/admin/compras/nova" variant="solid" className="h-11 px-6" data-help="new-purchase">
            Registrar compra
          </ActionLink>
        }
      />

      {purchases.length === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          action={
            <ActionLink href="/admin/compras/nova" variant="outline" className="h-11 px-6">
              Registrar a primeira compra
            </ActionLink>
          }
        >
          Nenhuma compra registrada ainda. Cada compra soma no estoque e guarda o preço que você pagou.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {purchases.map((purchase) => (
            <li key={purchase.id}>
              <Link
                href={`/admin/compras/${purchase.id}`}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm outline-none transition-colors hover:border-[var(--gold)]/50 focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
                  purchase.status === "cancelled" && "opacity-60",
                )}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-base font-semibold">
                    {formatDateBR(purchase.purchasedAt)}
                    {purchase.supplier ? ` · ${purchase.supplier}` : ""}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {purchase.itemCount} {purchase.itemCount === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {purchase.status === "cancelled" ? <StatusPill tone="muted">Cancelada</StatusPill> : null}
                  <span className="text-lg font-semibold tabular-nums">{formatMoney(purchase.totalAmount)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
