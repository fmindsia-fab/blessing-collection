import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getCollectionBySlug } from "@/lib/collections/queries";
import { listProducts } from "@/lib/products/queries";
import { ProductCard } from "@/components/catalog/product-card";
import { PageViewTracker } from "@/components/shared/page-view-tracker";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const store = await getActiveStore();
  const collection = await getCollectionBySlug(store.id, slug);

  if (!collection) notFound();

  const { products, total, hasMore } = await listProducts({
    storeId: store.id,
    collectionId: collection.id,
    page,
  });

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16">
      <PageViewTracker storeId={store.id} eventType="collection_view" collectionId={collection.id} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{collection.name}</h1>
        {collection.description ? <p className="text-sm text-zinc-600">{collection.description}</p> : null}
        <p className="text-sm text-zinc-500">{total} produtos</p>
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">Nenhum produto nesta coleção ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
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
        <div className="flex justify-center pt-4">
          <a
            href={`/colecoes/${slug}?page=${page + 1}`}
            className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium hover:border-zinc-500"
          >
            Carregar mais
          </a>
        </div>
      ) : null}
    </main>
  );
}
