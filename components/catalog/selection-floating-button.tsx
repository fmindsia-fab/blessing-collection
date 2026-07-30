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
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-zinc-800"
    >
      <ShoppingBagIcon className="size-4" />
      Minha seleção ({items.length})
    </Link>
  );
}
