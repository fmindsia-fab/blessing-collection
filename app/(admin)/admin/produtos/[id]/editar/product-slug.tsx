"use client";

import { useState, useTransition } from "react";
import { refreshProductSlug } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";

/**
 * URL pública da peça, com opção de regenerá-la a partir do nome.
 *
 * O botão só aparece quando o slug atual difere do que o nome geraria — caso
 * típico de peça renomeada depois de criada. Trocar a URL quebra links já
 * compartilhados, então a decisão fica com a proprietária.
 */
export function ProductSlug({
  productId,
  name,
  slug,
}: {
  productId: string;
  name: string;
  slug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const suggested = slugify(name);
  const isOutdated = suggested.length > 0 && suggested !== slug;

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-border bg-card px-5 py-4">
      <span className="text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
        URL da página
      </span>

      <code className="font-mono text-sm break-all">/produtos/{slug}</code>

      {isOutdated ? (
        <div className="flex flex-col gap-2 pt-1">
          <p className="text-xs leading-relaxed text-muted-foreground">
            O nome mudou desde a criação. Atualizar deixa a URL como
            <code className="mx-1 font-mono">/produtos/{suggested}</code>, mas links já enviados a
            clientes deixam de funcionar.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            className="w-fit"
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await refreshProductSlug(productId);
                if (result.error) setError(result.error);
              })
            }
          >
            {isPending ? "Atualizando..." : `Atualizar para /${suggested}`}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
