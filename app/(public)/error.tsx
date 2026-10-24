"use client";

import { useEffect } from "react";
import { ActionButton, ActionLink } from "@/components/ui/action";

// Falha inesperada ao carregar o catálogo (rede, serviço fora do ar). Em vez de uma tela
// quebrada, explica em linguagem simples e deixa tentar de novo com um toque.
export default function CatalogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // O digest permite achar o erro nos logs sem expor detalhes para a cliente.
    console.error("[catálogo]", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="kicker">Algo não saiu como esperado</span>
        <h1 className="font-[family-name:var(--font-brand)] text-3xl leading-tight tracking-tight sm:text-4xl">
          Não conseguimos carregar esta página
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Pode ser a conexão. Toque em &quot;Tentar de novo&quot;. Se continuar, volte daqui a alguns minutos.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <ActionButton type="button" variant="solid" onClick={reset}>
            Tentar de novo
          </ActionButton>
          <ActionLink href="/" variant="quiet">
            Página inicial
          </ActionLink>
        </div>
      </div>
    </main>
  );
}
