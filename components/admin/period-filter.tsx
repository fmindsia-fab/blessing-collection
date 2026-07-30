import Link from "next/link";
import { ANALYTICS_PERIODS, PERIOD_LABEL, type AnalyticsPeriod } from "@/lib/analytics/queries";
import { cn } from "@/lib/utils";

// Filtro por links: trocar o período é só um novo `?periodo=`, sem estado no client.
export function PeriodFilter({ basePath, active }: { basePath: string; active: AnalyticsPeriod }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ANALYTICS_PERIODS.map((period) => (
        <Link
          key={period}
          href={`${basePath}?periodo=${period}`}
          aria-current={period === active ? "true" : undefined}
          className={cn(
            "border px-4 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] transition-colors",
            period === active
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
          )}
        >
          {PERIOD_LABEL[period]}
        </Link>
      ))}
    </div>
  );
}
