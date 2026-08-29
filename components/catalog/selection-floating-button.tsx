"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBagIcon } from "lucide-react";
import { useSelection } from "@/lib/selection/selection-context";

export function SelectionFloatingButton() {
  const { items, isHydrated } = useSelection();
  const pathname = usePathname();

  // Sem itens, ainda hidratando, ou já na página de revisão: não mostra nada.
  if (!isHydrated || items.length === 0 || pathname === "/selecao") return null;

  return (
    <Link
      href="/selecao"
      className="reveal group fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 bg-foreground px-6 py-4 text-[0.6875rem] uppercase tracking-[0.16em] text-background shadow-[0_10px_34px_-10px_oklch(0.25_0.02_45/0.45)] outline-none transition-colors duration-300 hover:bg-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <ShoppingBagIcon className="size-4" />
      Minha seleção ({items.length})
    </Link>
  );
}
