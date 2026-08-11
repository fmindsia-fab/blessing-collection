import { getActiveStore } from "@/lib/store/get-active-store";
import { listColorsInUse, listProducts } from "@/lib/products/queries";
import { listModelsInUse } from "@/lib/models/queries";
import { listCategoriesInUse } from "@/lib/categories/queries";
import { ProductCard } from "@/components/catalog/product-card";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { BackLink } from "@/components/shared/back-link";
import { ActionLink } from "@/components/ui/action";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getActiveStore();

  return {
    title: `Catálogo | ${store.name}`,
    description: `Todas as peças disponíveis no catálogo da ${store.name}.`,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    busca?: string;
    cor?: string;
    disponibilidade?: string;
    modelo?: string;
    categoria?: string;
  }>;
}) {
  const { page: pageParam, busca, cor, disponibilidade, modelo, categoria } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const store = await getActiveStore();

  // As opções dos filtros vêm antes da listagem: os filtros chegam por slug
  // (URL legível) e a query precisa dos ids.
  const [models, categories, colors] = await Promise.all([
    listModelsInUse(store.id),
    listCategoriesInUse(store.id),
    listColorsInUse(store.id),
  ]);

  const activeModelId = modelo ? models.find((m) => m.slug === modelo)?.id : undefined;
  const activeCategoryId = categoria ? categories.find((c) => c.slug === categoria)?.id : undefined;
  const activeColorId = cor ? colors.find((c) => c.slug === cor)?.id : undefined;

  const { products, total, hasMore } = await listProducts({
    storeId: store.id,
    page,
    search: busca,
    colorId: activeColorId,
    availability: disponibilidade,
    modelId: activeModelId,
    categoryId: activeCategoryId,
  });

  const isEmpty = products.length === 0;

  // Preserva todos os filtros ao paginar.
  const nextPageQuery = new URLSearchParams({ page: String(page + 1) });
  if (busca) nextPageQuery.set("busca", busca);
  if (cor) nextPageQuery.set("cor", cor);
  if (disponibilidade) nextPageQuery.set("disponibilidade", disponibilidade);
  if (modelo) nextPageQuery.set("modelo", modelo);
  if (categoria) nextPageQuery.set("categoria", categoria);

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16">
      <BackLink href="/">Voltar para a página inicial</BackLink>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="kicker">O catálogo</span>
        <h1 className="font-[family-name:var(--font-brand)] text-4xl leading-none tracking-tight sm:text-5xl">
          Peças
        </h1>
        <span aria-hidden className="h-px w-12 rounded-full bg-[var(--gold)]" />
      </div>

      <form className="mx-auto w-full max-w-md" role="search">
        {/* Buscar não pode descartar os filtros já aplicados: o GET só envia os
            campos do form, então os ativos seguem como hidden. */}
        {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
        {modelo ? <input type="hidden" name="modelo" value={modelo} /> : null}
        {cor ? <input type="hidden" name="cor" value={cor} /> : null}
        {disponibilidade ? (
          <input type="hidden" name="disponibilidade" value={disponibilidade} />
        ) : null}
        <label htmlFor="busca" className="sr-only">
          Buscar peças por nome
        </label>
        <input
          id="busca"
          type="search"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome…"
          className="w-full rounded-full border border-border bg-card px-5 py-3 text-center text-sm shadow-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:ring-2 focus:ring-[var(--gold)]/40"
        />
      </form>

      <CatalogFilters
        basePath="/produtos"
        colors={colors}
        models={models}
        categories={categories}
        activeColor={cor}
        activeAvailability={disponibilidade}
        activeModel={modelo}
        activeCategory={categoria}
        search={busca}
      />

      <p className="text-center text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {total} {total === 1 ? "peça encontrada" : "peças encontradas"}
      </p>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-[family-name:var(--font-brand)] text-xl text-muted-foreground">
            Nenhuma peça encontrada{busca ? ` para "${busca}"` : ""}.
          </p>
          <ActionLink href="/produtos" variant="underline">
            Ver todas as peças
          </ActionLink>
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
          <ActionLink href={`/produtos?${nextPageQuery.toString()}`} variant="outline">
            Carregar mais
          </ActionLink>
        </div>
      ) : null}
    </main>
  );
}
