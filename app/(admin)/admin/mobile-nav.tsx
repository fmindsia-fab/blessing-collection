"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdminNavLink } from "./admin-nav-link";
import { ShareButton } from "@/components/shared/share-button";

type NavItem = { href: string; label: string };

export function MobileNav({
  navItems,
  storeName,
  siteUrl,
}: {
  navItems: NavItem[];
  storeName: string;
  siteUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
          />
        }
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetTitle>{storeName}</SheetTitle>
        <nav className="flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
          <ShareButton
            url={siteUrl}
            title={storeName}
            message={`Olha o catálogo da ${storeName}, que peças lindas!`}
            label="Compartilhar catálogo"
            variant="outline"
          />
          <Link
            href="/"
            className="text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4"
          >
            Ver catálogo ↗
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
