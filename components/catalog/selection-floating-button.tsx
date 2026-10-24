"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelection } from "@/lib/selection/selection-context";

export function SelectionFloatingButton() {
  const { items, isHydrated } = useSelection();
  const pathname = usePathname();

  // Sem itens, ainda hidratando, ou já na página de revisão: não mostra nada.
  if (!isHydrated || items.length === 0 || pathname === "/sacola") return null;

  // Na página de uma peça o celular mostra a barra fixa de preço no rodapé: sobe para não ficar por baixo.
  const isProductPage = pathname.startsWith("/produtos/");

  return (
    <Link
      href="/sacola"
      className={cn("reveal group fixed right-6 z-50 inline-flex items-center gap-2.5 bg-foreground px-6 py-4 text-xs uppercase tracking-[0.16em] text-background shadow-[0_10px_34px_-10px_oklch(0.25_0.02_45/0.45)] outline-none transition-colors duration-300 hover:bg-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background", isProductPage ? "bottom-24 lg:bottom-6" : "bottom-6")}
    >
      <ShoppingBagIcon className="size-4" />
      Minha sacola ({items.length})
    </Link>
  );
}
