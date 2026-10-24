import { ProductCard } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { BackLink } from "@/components/shared/back-link";
import { ActionLink } from "@/components/ui/action";
import { PAGE_SIZE } from "@/lib/products/queries";
import type { CatalogSort } from "@/lib/catalog/sort";
import type { ProductStatus } from "@/types/database.types";

type ListedProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  status: ProductStatus;
  cover_image_url: string | null;
  from_price?: boolean;
  has_variants?: boolean;
  swatches?: { hex: string; hexSecondary: string | null; name: string }[];
};

// Página de uma categoria ou de uma coleção. Antes tinha um visual à parte (cinzas fixos, sem a
// fonte da loja); agora segue a mesma linguagem de /produtos: título da marca, grade, ordenação
// e "Carregar mais" que preserva a escolha.
export function GroupListing({
  kicker,
  title,
  description,
  basePath,
  products,
  total,
  hasMore,
  page,
  sort,
  emptyMessage,
}: {
  kicker: string;
  title: string;
  description?: string | null;
  basePath: string;
  products: ListedProduct[];
  total: number;
  hasMore: boolean;
  page: number;
  sort?: CatalogSort;
  emptyMessage: string;
}) {
  const previousCount = (page - 1) * PAGE_SIZE;

  const nextPageQuery = new URLSearchParams({ page: String(page + 1) });
  if (sort) nextPageQuery.set("ordem", sort);

  return (
    <>
      <BackLink href="/">Voltar para a página inicial</BackLink>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="kicker">{kicker}</span>
        <h1 className="font-[family-name:var(--font-brand)] text-4xl leading-none tracking-tight sm:text-5xl">
          {title}
        </h1>
        <span aria-hidden className="h-px w-12 rounded-full bg-[var(--gold)]" />
        {description ? (
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "peça" : "peças"}
        </p>
        {total > 1 ? <SortSelect basePath={basePath} params={{}} active={sort} /> : null}
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center font-[family-name:var(--font-brand)] text-xl text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] lg:gap-x-8">
          {products.map((product, index) => (
            <ProductCard
              productId={product.id}
              fromPrice={product.from_price}
              hasVariants={product.has_variants}
              swatches={product.swatches}
              key={product.id}
              anchorId={`peca-${index}`}
              index={Math.max(0, index - previousCount)}
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
        <div className="flex flex-col items-center gap-3 pt-6">
          <ActionLink href={`${basePath}?${nextPageQuery.toString()}#peca-${products.length}`} variant="outline">
            Carregar mais
          </ActionLink>
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {products.length} de {total}
          </span>
        </div>
      ) : null}
    </>
  );
}
