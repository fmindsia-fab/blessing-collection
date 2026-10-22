import { cn } from "@/lib/utils";

// Bloco de carregamento: pulso suave, desligado para quem prefere menos movimento.
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
