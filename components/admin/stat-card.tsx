export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="group relative flex flex-col gap-2.5 overflow-hidden rounded-[var(--radius-image)] border border-border bg-card px-6 py-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md">
      {/* Halo de acento no canto: dá cor ao card sem tingir o texto. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-[var(--gold)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
      />

      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-4xl leading-none font-semibold tabular-nums">{value}</span>
      {hint ? <span className="text-sm leading-relaxed text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
