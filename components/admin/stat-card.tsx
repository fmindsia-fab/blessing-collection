import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon, type LucideIcon } from "lucide-react";
import type { Trend } from "@/lib/analytics/series";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  /** Variação contra o período anterior; só aparece quando há base de comparação real. */
  trend?: Trend | null;
}) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRightIcon : trend?.direction === "down" ? ArrowDownRightIcon : MinusIcon;

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon ? (
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--gold)]"
          >
            <Icon className="size-[1.125rem]" />
          </span>
        ) : null}
      </div>
      <span className="text-4xl leading-none font-semibold tabular-nums tracking-tight">{value}</span>
      {trend ? (
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <span className="flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5">
            <TrendIcon className="size-3.5" aria-hidden />
            {trend.direction === "flat" ? "igual" : `${trend.percent}%`}
          </span>
          <span className="font-normal text-muted-foreground">
            {trend.direction === "up"
              ? "a mais que no período anterior"
              : trend.direction === "down"
                ? "a menos que no período anterior"
                : "ao período anterior"}
          </span>
        </span>
      ) : null}
      {hint ? <span className="text-sm leading-relaxed text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
