import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getCollectionBySlug } from "@/lib/collections/queries";
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
  const collection = await getCollectionBySlug(store.id, slug);

  if (!collection) return { title: "Coleção não encontrada" };

  return {
    title: `${collection.name} | ${store.name}`,
    description:
      collection.description ?? `Peças da coleção ${collection.name} no catálogo da ${store.name}.`,
  };
}

export default async function CollectionPage({
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
  const collection = await getCollectionBySlug(store.id, slug);

  if (!collection) notFound();

  const { products, total, hasMore } = await listProducts({
    storeId: store.id,
    collectionId: collection.id,
    page,
    sort,
  });

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16">
      <PageViewTracker storeId={store.id} eventType="collection_view" collectionId={collection.id} />

      <GroupListing
        kicker="Coleção"
        title={collection.name}
        description={collection.description}
        basePath={`/colecoes/${slug}`}
        products={products}
        total={total}
        hasMore={hasMore}
        page={page}
        sort={sort}
        emptyMessage="Nenhuma peça nesta coleção ainda."
      />
    </main>
  );
}
