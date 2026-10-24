import { ActionLink } from "@/components/ui/action";

// Qualquer página do catálogo que não existe (categoria ou coleção removida, endereço digitado
// errado). Em vez da página de erro genérica, leva a cliente de volta para as peças.
export default function CatalogNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="kicker">Página não encontrada</span>
        <h1 className="font-[family-name:var(--font-brand)] text-3xl leading-tight tracking-tight sm:text-4xl">
          Não encontramos o que você procurava
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Este endereço pode ter mudado ou não existe mais. Veja o catálogo para encontrar a peça que você quer.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <ActionLink href="/produtos" variant="solid">
            Ver o catálogo
          </ActionLink>
          <ActionLink href="/" variant="quiet">
            Página inicial
          </ActionLink>
        </div>
      </div>
    </main>
  );
}
