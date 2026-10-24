import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto da página da peça: galeria à esquerda e nome, preço e botões à direita,
// como na página real.
export default function ProductLoading() {
  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16" role="status" aria-live="polite">
      <span className="sr-only">Carregando a peça…</span>
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] w-full rounded-[var(--radius-image)]" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="size-20 rounded-[var(--radius)]" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </main>
  );
}
