import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getCategoryBySlug } from "@/lib/categories/queries";
import { listProducts } from "@/lib/products/queries";
import { GroupListing } from "@/components/catalog/group-listing";
import { parseCatalogSort } from "@/lib/catalog/sort";
import { PageViewTracker } from "@/components/shared/page-view-tracker";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getActiveStore();
  const category = await getCategoryBySlug(store.id, slug);

  if (!category) return { title: "Categoria não encontrada" };

  return {
    title: `${category.name} | ${store.name}`,
    description: category.description ?? `Peças da categoria ${category.name} no catálogo da ${store.name}.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; ordem?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam, ordem } = await searchParams;
  const sort = parseCatalogSort(ordem);
  const page = Math.max(1, Number(pageParam) || 1);

  const store = await getActiveStore();
  const category = await getCategoryBySlug(store.id, slug);

  if (!category) notFound();

  const { products, total, hasMore } = await listProducts({
    storeId: store.id,
    categoryId: category.id,
    page,
    sort,
  });

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16">
      <PageViewTracker storeId={store.id} eventType="category_view" categoryId={category.id} />

      <GroupListing
        kicker="Categoria"
        title={category.name}
        description={category.description}
        basePath={`/categorias/${slug}`}
        products={products}
        total={total}
        hasMore={hasMore}
        page={page}
        sort={sort}
        emptyMessage="Nenhuma peça nesta categoria ainda."
      />
    </main>
  );
}
