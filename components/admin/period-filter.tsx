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
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            period === active
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
          )}
        >
          {PERIOD_LABEL[period]}
        </Link>
      ))}
    </div>
  );
}
