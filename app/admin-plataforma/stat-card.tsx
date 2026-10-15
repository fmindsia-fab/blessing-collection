import { cn } from "@/lib/utils";

type Tone = "default" | "positive" | "warning" | "danger";

const VALUE_TONES: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-foreground",
  warning: "text-[color:oklch(0.55_0.14_65)] dark:text-[color:oklch(0.8_0.13_75)]",
  danger: "text-destructive",
};

const DOT_TONES: Record<Tone, string> = {
  default: "bg-muted-foreground/40",
  positive: "bg-[var(--gold)]",
  warning: "bg-[color:oklch(0.7_0.15_70)]",
  danger: "bg-destructive",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border bg-card p-5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden className={cn("size-2 rounded-full", DOT_TONES[tone])} />
        {label}
      </span>
      <span className={cn("text-3xl leading-none font-semibold tracking-tight tabular-nums", VALUE_TONES[tone])}>
        {value}
      </span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
