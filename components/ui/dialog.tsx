"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Popup central (modal) sobre Dialog do base-ui — mesma primitiva do Sheet
// (components/ui/sheet.tsx), só o posicionamento/animação muda. Usado para
// detalhes rápidos sem navegar para outra página (ex.: calendário de
// pedidos).

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "relative flex w-full max-w-sm flex-col gap-4 rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
            aria-label="Fechar"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </div>
    </DialogPrimitive.Portal>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("pr-8 text-lg font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogTitle, DialogDescription };
