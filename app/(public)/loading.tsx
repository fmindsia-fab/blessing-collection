import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto padrão do catálogo enquanto uma página carrega: título e grade de cartões no
// mesmo formato dos reais, para a tela não "pular" quando as peças chegam.
export default function CatalogLoading() {
  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16" role="status" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] lg:gap-x-8">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] w-full rounded-[var(--radius-image)]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
