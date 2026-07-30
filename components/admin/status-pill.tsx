import { cn } from "@/lib/utils";

type Tone = "positive" | "neutral" | "muted" | "accent";

const TONES: Record<Tone, string> = {
  positive: "border-transparent bg-[var(--gold)]/15 text-foreground",
  accent: "border-transparent bg-accent/60 text-foreground",
  neutral: "border-border text-muted-foreground",
  muted: "border-transparent bg-secondary text-muted-foreground",
};

// Selo curto de estado: substitui o texto corrido "R$ 80 · Disponível · Destaque",
// que exigia leitura para distinguir preço de status.
export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.12em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
