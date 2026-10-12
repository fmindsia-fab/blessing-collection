import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// <select> nativo (não o Select do base-ui) para formulários simples que só
// precisam de name/defaultValue via FormData — mesma altura/fonte do Input,
// em vez do h-8 hardcoded que antes destoava em cada formulário.
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "h-11 w-full appearance-none rounded-[var(--radius)] border border-input bg-background px-3.5 py-1 pr-10 text-base transition-colors outline-none focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };
