import Link from "next/link";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import type { GettingStartedItem } from "@/lib/onboarding/getting-started";
import { cn } from "@/lib/utils";

// "Comece por aqui": passos simples para loja nova, com o que já foi feito marcado.
// Some sozinho quando tudo estiver concluído.
export function GettingStarted({ items }: { items: GettingStartedItem[] }) {
  const doneCount = items.filter((item) => item.done).length;
  if (doneCount === items.length) return null;

  const percent = Math.round((100 * doneCount) / items.length);

  return (
    <section
      aria-labelledby="getting-started-title"
      className="flex flex-col gap-4 rounded-2xl border border-[var(--gold)]/30 bg-[var(--brand-soft)]/60 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="getting-started-title" className="text-lg font-semibold tracking-tight">
            Comece por aqui
          </h2>
          <span className="text-sm font-medium text-muted-foreground">
            {doneCount} de {items.length} prontos
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={doneCount}
          aria-label="Passos concluídos"
          className="h-2 overflow-hidden rounded-full bg-background/70"
        >
          <div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
                item.done
                  ? "border-transparent opacity-70"
                  : "border-border hover:border-[var(--gold)]/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                  item.done
                    ? "border-[var(--gold)] bg-[var(--gold)] text-primary-foreground"
                    : "border-border text-transparent",
                )}
              >
                <CheckIcon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("text-base font-semibold", item.done && "line-through")}>
                  {item.title}
                  <span className="sr-only">{item.done ? " (já feito)" : " (falta fazer)"}</span>
                </span>
                {item.done ? null : <span className="text-sm text-muted-foreground">{item.hint}</span>}
              </span>
              {item.done ? null : (
                <ChevronRightIcon
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
