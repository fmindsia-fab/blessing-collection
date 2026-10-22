"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarContent } from "./admin-sidebar";
import { usePortalThemeProps } from "./theme-provider";

// Drawer do celular e do tablet estreito: reaproveita o conteúdo da sidebar do desktop.
export function MobileNav({ storeName, siteUrl }: { storeName: string; siteUrl: string }) {
  const [open, setOpen] = useState(false);
  const portalTheme = usePortalThemeProps();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      {/* O drawer abre num portal, fora do wrapper do tema: repete as variáveis e a classe aqui. */}
      <SheetContent
        side="left"
        className={cn(portalTheme.className, "w-72 bg-sidebar p-4 text-sidebar-foreground")}
        style={portalTheme.style}
      >
        <SheetTitle className="sr-only">Menu do painel de {storeName}</SheetTitle>
        <SidebarContent variant="drawer" storeName={storeName} siteUrl={siteUrl} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
