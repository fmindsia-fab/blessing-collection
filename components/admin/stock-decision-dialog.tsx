"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortalThemeProps } from "@/app/(admin)/admin/theme-provider";

// Cancelar um pedido que já descontou materiais do estoque: só a artesã sabe se a peça chegou a ser
// feita. Por isso a escolha é dela: devolver (a peça não foi feita) ou manter descontado (o
// material já foi usado). Nada é apagado: os dois caminhos ficam registrados no extrato.
export function StockDecisionDialog({
  open,
  onOpenChange,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (returnStock: boolean) => void;
}) {
  const portalTheme = usePortalThemeProps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent {...portalTheme}>
        <DialogTitle>Cancelar e devolver os materiais ao estoque?</DialogTitle>
        <DialogDescription>
          Este pedido já descontou materiais do estoque. Se a peça ainda não foi feita, devolva os materiais. Se o
          material já foi usado, mantenha descontado.
        </DialogDescription>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onChoose(true);
            }}
          >
            Cancelar e devolver ao estoque
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onChoose(false);
            }}
          >
            Cancelar e manter descontado
          </Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
