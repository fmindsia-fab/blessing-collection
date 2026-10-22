import type { LucideIcon } from "lucide-react";

// Estado vazio padrão do painel: ícone, frase que diz o que fazer e (opcional) uma ação.
export function EmptyState({
  icon: Icon,
  children,
  action,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--gold)]"
      >
        <Icon className="size-5" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}
