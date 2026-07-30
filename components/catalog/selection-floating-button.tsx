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
      className="reveal fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 bg-foreground px-6 py-4 text-xs uppercase tracking-[0.16em] text-background shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] transition-colors hover:bg-[var(--gold)]"
    >
      <ShoppingBagIcon className="size-4" />
      Minha seleção ({items.length})
    </Link>
  );
}
