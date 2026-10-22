"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "./admin-sidebar";

// Drawer do celular e do tablet estreito: reaproveita o conteúdo da sidebar do desktop.
export function MobileNav({ storeName, siteUrl }: { storeName: string; siteUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-4 text-sidebar-foreground">
        <SheetTitle className="sr-only">Menu do painel de {storeName}</SheetTitle>
        <SidebarContent storeName={storeName} siteUrl={siteUrl} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
