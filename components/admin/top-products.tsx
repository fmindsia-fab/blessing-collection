import Image from "next/image";
import { PackageIcon } from "lucide-react";
import type { ProductRanking } from "@/lib/analytics/queries";
import { cn } from "@/lib/utils";

// Ranking visual do dashboard: posição, foto real, nome e as três métricas.
// A lógica do ranking (RPC get_product_rankings) é a mesma; só a apresentação mudou.
export function TopProducts({
  title,
  rows,
  covers,
  emptyMessage,
}: {
  title: string;
  rows: ProductRanking[];
  covers: Record<string, string>;
  emptyMessage: string;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--gold)]"
          >
            <PackageIcon className="size-5" />
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ol className="flex flex-col divide-y divide-border/70">
          {rows.map((row, index) => {
            const cover = covers[row.product_id];
            return (
              <li key={row.product_id} className="flex items-center gap-3 py-3 sm:gap-4">
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    index < 3 ? "bg-[var(--gold)] text-primary-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>

                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary sm:size-14">
                  {cover ? (
                    <Image src={cover} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-muted-foreground/60">
                      <PackageIcon className="size-5" aria-hidden />
                    </span>
                  )}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold sm:text-base">{row.product_name}</span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {row.views} visualizações · {row.clicks} cliques · {row.interest_rate}%
                  </span>
                </div>

                <dl className="hidden shrink-0 items-center gap-6 text-right sm:flex">
                  <Metric label="Visualizações" value={row.views} />
                  <Metric label="Cliques" value={row.clicks} />
                  <Metric label="Interesse" value={`${row.interest_rate}%`} />
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col">
      <dd className="text-base font-semibold tabular-nums">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
