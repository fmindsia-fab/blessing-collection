"use client";

import { useState, useTransition } from "react";
import { CopyIcon } from "lucide-react";
import { duplicateProduct } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";

// Duplica uma peça parecida: a ação cria a cópia (inativa, sem fotos) e abre a tela de edição
// dela. O botão fica bloqueado enquanto cria, para um clique duplo não gerar duas cópias.
export function DuplicateProductButton({
  productId,
  productName,
  variant = "icon",
}: {
  productId: string;
  productName: string;
  /** "icon": só o ícone (linha da lista). "text": botão com texto (tela de edição). */
  variant?: "icon" | "text";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function duplicate() {
    setError(null);
    startTransition(async () => {
      const result = await duplicateProduct(productId);
      // Em caso de sucesso a ação redireciona; só chega aqui quando há erro.
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={duplicate}
          data-help="product-duplicate"
          aria-label={`Duplicar ${productName}`}
          title="Duplicar: cria uma cópia desta peça para você ajustar"
        >
          <CopyIcon />
        </Button>
      ) : (
        <Button type="button" variant="outline" disabled={isPending} onClick={duplicate} data-help="product-duplicate">
          <CopyIcon />
          {isPending ? "Duplicando..." : "Duplicar peça"}
        </Button>
      )}
      {error ? (
        <span role="alert" className="text-sm font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </>
  );
}
