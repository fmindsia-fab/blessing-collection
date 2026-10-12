"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Painel lateral (drawer) construído sobre Dialog do base-ui — foco preso,
// Escape, backdrop e portal já resolvidos pela primitiva; só o
// posicionamento lateral e a animação de slide-in são nossos. Usado para a
// navegação mobile do admin (app/(admin)/admin/layout.tsx).

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

function SheetBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: DialogPrimitive.Popup.Props & { side?: "left" | "right" }) {
  return (
    <DialogPrimitive.Portal>
      <SheetBackdrop />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 z-50 flex h-full w-full max-w-xs flex-col gap-4 bg-background p-6 shadow-lg outline-none",
          side === "left"
            ? "left-0 border-r border-border data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left"
            : "right-0 border-l border-border data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          aria-label="Fechar menu"
        >
          <XIcon className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
