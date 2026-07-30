import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listAvailableColors, listProducts } from "@/lib/products/queries";
import { ProductCard } from "@/components/catalog/product-card";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { BackLink } from "@/components/shared/back-link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    busca?: string;
    cor?: string;
    disponibilidade?: string;
  }>;
}) {
  const { page: pageParam, busca, cor, disponibilidade } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const store = await getActiveStore();
  const [{ products, total, hasMore }, colors] = await Promise.all([
    listProducts({
      storeId: store.id,
      page,
      search: busca,
      color: cor,
      availability: disponibilidade,
    }),
    listAvailableColors(store.id),
  ]);

  const isEmpty = products.length === 0;

  // Preserva todos os filtros ao paginar.
  const nextPageQuery = new URLSearchParams({ page: String(page + 1) });
  if (busca) nextPageQuery.set("busca", busca);
  if (cor) nextPageQuery.set("cor", cor);
  if (disponibilidade) nextPageQuery.set("disponibilidade", disponibilidade);

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16">
      <BackLink href="/">Voltar para a página inicial</BackLink>

      <div className="rule-heading flex flex-col gap-2">
        <span className="kicker">O catálogo</span>
        <h1 className="font-[family-name:var(--font-brand)] text-4xl leading-none tracking-tight sm:text-5xl">
          Peças
        </h1>
      </div>

      <form className="max-w-sm" role="search">
        <label htmlFor="busca" className="sr-only">
          Buscar peças por nome
        </label>
        <input
          id="busca"
          type="search"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome…"
          className="w-full border-b border-border bg-transparent pb-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground"
        />
      </form>

      <CatalogFilters
        basePath="/produtos"
        colors={colors}
        activeColor={cor}
        activeAvailability={disponibilidade}
        search={busca}
      />

      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {total} {total === 1 ? "peça encontrada" : "peças encontradas"}
      </p>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-[family-name:var(--font-brand)] text-xl text-muted-foreground">
            Nenhuma peça encontrada{busca ? ` para "${busca}"` : ""}.
          </p>
          <Link
            href="/produtos"
            className="text-xs uppercase tracking-[0.16em] underline underline-offset-4 transition-colors hover:text-[var(--gold)]"
          >
            Ver todas as peças
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] lg:gap-x-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              index={index}
              slug={product.slug}
              name={product.name}
              price={product.price}
              status={product.status}
              coverImageUrl={product.cover_image_url}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center pt-6">
          <Link
            href={`/produtos?${nextPageQuery.toString()}`}
            className="border border-foreground px-8 py-3 text-xs uppercase tracking-[0.18em] transition-colors hover:bg-foreground hover:text-background"
          >
            Carregar mais
          </Link>
        </div>
      ) : null}
    </main>
  );
}
