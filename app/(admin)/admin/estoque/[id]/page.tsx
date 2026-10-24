import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getMaterialStockDetail, type MovementRow } from "@/lib/stock/queries";
import { STOCK_LEVEL_LABEL, stockLevel, summarizeCosts } from "@/lib/stock/calc";
import { formatDateBR, formatMoney, formatQuantity, formatUnitCost } from "@/lib/stock/format";
import { BackLink } from "@/components/shared/back-link";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { StatusPill } from "@/components/admin/status-pill";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<MovementRow["kind"], string> = {
  purchase: "Compra",
  consumption: "Usado em pedido",
  return: "Devolvido ao estoque",
  adjustment: "Ajuste",
};

function Summary({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      {hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export default async function MaterialStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const detail = await getMaterialStockDetail(store.id, id);
  if (!detail) notFound();

  const { material, stock, movements, pricePoints } = detail;
  const level = stockLevel(stock, material.minStock, material.tracked);
  const costs = summarizeCosts(
    pricePoints.map((point) => ({ date: point.date, quantity: point.quantity, totalCost: point.totalCost })),
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink href="/admin/estoque">Estoque</BackLink>

      <PageHeading
        kicker="Extrato do material"
        title={material.name}
        description={`Tudo o que entrou e saiu, e os preços que você pagou. Unidade: ${material.unit}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Summary
          label="Você tem"
          value={`${formatQuantity(stock)} ${material.unit}`}
          hint={material.tracked ? STOCK_LEVEL_LABEL[level] : "Sem controle de estoque"}
        />
        <Summary label="Custo cadastrado" value={formatUnitCost(material.unitCost)} hint={`por ${material.unit}`} />
        <Summary
          label="Último preço pago"
          value={costs.lastUnitCost === null ? "—" : formatUnitCost(costs.lastUnitCost)}
          hint={costs.lastUnitCost === null ? "Nenhuma compra ainda" : `por ${material.unit}`}
        />
        <Summary
          label="Preço médio pago"
          value={costs.averageUnitCost === null ? "—" : formatUnitCost(costs.averageUnitCost)}
          hint={
            costs.lowestUnitCost !== null && costs.highestUnitCost !== null
              ? `de ${formatUnitCost(costs.lowestUnitCost)} a ${formatUnitCost(costs.highestUnitCost)}`
              : undefined
          }
        />
      </div>

      <PageSection id="movimentos" title="Movimentos">
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum movimento ainda. Registre uma compra ou ajuste o estoque.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/70">
            {movements.map((movement) => (
              <li key={movement.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">
                    {KIND_LABEL[movement.kind]}
                    {movement.purchaseId ? (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/compras/${movement.purchaseId}`}
                          className="underline underline-offset-4 hover:text-[var(--gold)]"
                        >
                          ver compra
                        </Link>
                      </>
                    ) : null}
                    {movement.orderId ? (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/pedidos/${movement.orderId}`}
                          className="underline underline-offset-4 hover:text-[var(--gold)]"
                        >
                          ver pedido
                        </Link>
                      </>
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDateBR(movement.createdAt)}
                    {movement.note ? ` · ${movement.note}` : ""}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-base font-semibold tabular-nums",
                    movement.quantity < 0 ? "text-destructive" : "text-foreground",
                  )}
                >
                  {movement.quantity > 0 ? "+" : ""}
                  {formatQuantity(movement.quantity)} {material.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <PageSection id="precos" title="Preços pagos nas compras">
        {pricePoints.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Quando você registrar compras deste material, o histórico de preços aparece aqui.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/70">
            {pricePoints.map((point) => (
              <li key={`${point.purchaseId}-${point.date}-${point.totalCost}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">
                    {formatDateBR(point.date)}
                    {point.supplier ? ` · ${point.supplier}` : ""}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatQuantity(point.quantity)} {material.unit} por {formatMoney(point.totalCost)}
                  </span>
                </div>
                <StatusPill tone="neutral">
                  {formatUnitCost(point.unitCost)} por {material.unit}
                </StatusPill>
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </div>
  );
}
