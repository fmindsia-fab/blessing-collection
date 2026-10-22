import { Skeleton } from "@/components/ui/skeleton";

// Mostrado enquanto qualquer tela do painel carrega: mesmo esqueleto de cabeçalho,
// cartões e lista, para a página não "pular" quando o conteúdo chega.
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-live="polite">
      <span className="sr-only">Carregando…</span>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
