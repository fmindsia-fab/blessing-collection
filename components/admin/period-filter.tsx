import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Filtro por links: trocar o período é só um novo `?periodo=`, sem estado
 * no client. Genérico em T: outro domínio (ex: dashboard de pedidos) passa
 * seu próprio conjunto de períodos/labels, sem duplicar o componente.
 */
export function PeriodFilter<T extends string>({
  basePath,
  active,
  periods,
  labels,
}: {
  basePath: string;
  active: T;
  periods: readonly T[];
  labels: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {periods.map((period) => (
        <Link
          key={period}
          href={`${basePath}?periodo=${period}`}
          aria-current={period === active ? "true" : undefined}
          className={cn(
            "rounded-full border px-4 py-2 text-[0.6875rem] uppercase tracking-[0.12em] outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            period === active
              ? "border-foreground bg-foreground text-background shadow-sm"
              : "border-border text-muted-foreground hover:border-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {labels[period]}
        </Link>
      ))}
    </div>
  );
}
