export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="group relative flex flex-col gap-2 border border-border bg-card px-5 py-5 transition-colors hover:border-foreground/30">
      <span className="text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="font-[family-name:var(--font-brand)] text-[2rem] leading-none tabular-nums">
        {value}
      </span>
      {hint ? <span className="text-xs leading-relaxed text-muted-foreground">{hint}</span> : null}

      {/* Fio dourado no topo, revelado no hover. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px w-0 bg-[var(--gold)] transition-all duration-500 group-hover:w-full"
      />
    </div>
  );
}
