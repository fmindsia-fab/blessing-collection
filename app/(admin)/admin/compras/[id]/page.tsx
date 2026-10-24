import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getPurchase } from "@/lib/stock/queries";
import { formatDateBR, formatMoney, formatQuantity, formatUnitCost } from "@/lib/stock/format";
import { BackLink } from "@/components/shared/back-link";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { StatusPill } from "@/components/admin/status-pill";
import { CancelPurchaseButton } from "./cancel-purchase-button";

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const result = await getPurchase(store.id, id);
  if (!result) notFound();

  const { purchase, items } = result;
  const cancelled = purchase.status === "cancelled";
  const itemsTotal = items.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink href="/admin/compras">Compras</BackLink>

      <PageHeading
        kicker="Compra de materiais"
        title={`${formatDateBR(purchase.purchased_at)}${purchase.supplier ? ` · ${purchase.supplier}` : ""}`}
        description={cancelled ? "Esta compra foi cancelada: os itens saíram do estoque." : undefined}
        action={cancelled ? <StatusPill tone="muted">Cancelada</StatusPill> : undefined}
      />

      <PageSection id="itens" title="Itens comprados">
        <ul className="flex flex-col divide-y divide-border/70">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-base font-medium">
                  {item.materialId ? (
                    <Link href={`/admin/estoque/${item.materialId}`} className="underline-offset-4 hover:underline">
                      {item.materialName}
                    </Link>
                  ) : (
                    item.materialName
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatQuantity(item.quantity)} {item.unit} · {formatUnitCost(item.unitCost)} por {item.unit}
                </span>
              </div>
              <span className="text-base font-semibold tabular-nums">{formatMoney(item.totalCost)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Itens</dt>
            <dd className="tabular-nums">{formatMoney(itemsTotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Frete</dt>
            <dd className="tabular-nums">{formatMoney(Number(purchase.freight))}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base font-semibold">
            <dt>Total pago</dt>
            <dd className="tabular-nums">{formatMoney(Number(purchase.total_amount))}</dd>
          </div>
        </dl>

        {purchase.notes ? (
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-secondary/50 px-4 py-3 text-sm">{purchase.notes}</p>
        ) : null}
      </PageSection>

      {cancelled ? null : <CancelPurchaseButton purchaseId={purchase.id} />}
    </div>
  );
}
