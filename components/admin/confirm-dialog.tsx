"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortalThemeProps } from "@/app/(admin)/admin/theme-provider";

// Confirmação antes de uma ação que tira algo da lista. Substitui a janelinha nativa do
// navegador (pequena, sem a cara do painel) por um aviso grande, com botões claros.
// O botão principal vem em destaque vermelho; "Voltar" é a saída segura.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Remover",
  cancelLabel = "Voltar",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  const portalTheme = usePortalThemeProps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent {...portalTheme}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
