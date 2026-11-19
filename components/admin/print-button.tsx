"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Abre a janela de impressão do navegador, onde também dá para "Salvar como PDF". */
export function PrintButton({ label = "Imprimir ou salvar PDF" }: { label?: string }) {
  return (
    <Button type="button" onClick={() => window.print()} className="h-11 gap-2 px-6">
      <PrinterIcon className="size-4" />
      {label}
    </Button>
  );
}
