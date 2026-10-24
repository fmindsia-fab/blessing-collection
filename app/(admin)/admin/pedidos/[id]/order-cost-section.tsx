import Link from "next/link";
import { getOrderStockMovements } from "@/lib/stock/queries";
import { summarizeOrderCost } from "@/lib/stock/calc";
import { formatMoney, formatQuantity } from "@/lib/stock/format";

// Custo real dos materiais que este pedido usou (do estoque) e a margem sobre o valor do pedido.
// Só aparece quando o pedido já descontou materiais. O custo de cada material é o do DIA da baixa,
// então não muda se o preço do fio mudar depois. Não inclui mão de obra nem outros custos.
export async function OrderCostSection({
  storeId,
  orderId,
  orderTotal,
}: {
  storeId: string;
  orderId: string;
  orderTotal: number;
}) {
  const movements = await getOrderStockMovements(storeId, orderId);
  if (movements.length === 0) return null;

  const summary = summarizeOrderCost(movements, orderTotal);
  if (summary.lines.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Custo dos materiais deste pedido</h2>
        <p className="text-sm text-muted-foreground">
          Calculado com o que saiu do estoque, pelo preço do dia. Não inclui sua mão de obra.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border/70">
        {summary.lines.map((line) => (
          <li key={line.materialId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
            <Link href={`/admin/estoque/${line.materialId}`} className="font-medium underline-offset-4 hover:underline">
              {line.name}
            </Link>
            <span className="tabular-nums text-muted-foreground">
              {formatQuantity(line.used)} {line.unit} · {formatMoney(line.cost)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Valor do pedido</dt>
          <dd className="tabular-nums">{formatMoney(orderTotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Custo dos materiais</dt>
          <dd className="tabular-nums">{formatMoney(summary.totalCost)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-base font-semibold">
          <dt>Sobra depois dos materiais</dt>
          <dd className="tabular-nums">
            {formatMoney(summary.margin)}
            {summary.marginPercent !== null ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({summary.marginPercent}%)</span>
            ) : null}
          </dd>
        </div>
      </dl>
    </section>
  );
}
