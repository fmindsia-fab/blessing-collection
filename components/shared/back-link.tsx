import Link from "next/link";
import { Arrow } from "@/components/ui/arrow";

// Seta espelhada (scale-x-[-1]): mesma linguagem visual das setas de avanço,
// mas o traço cresce para a esquerda no hover.
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex w-fit items-center gap-2.5 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4"
    >
      <Arrow className="scale-x-[-1]" />
      {children}
    </Link>
  );
}
