import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}) {
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
      {hint ? <span className="text-sm leading-relaxed text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
