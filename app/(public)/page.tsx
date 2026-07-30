import Image from "next/image";
import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products/queries";
import { listCategories } from "@/lib/categories/queries";
import { listCollections } from "@/lib/collections/queries";
import { ProductCard } from "@/components/catalog/product-card";

export default async function HomePage() {
  const store = await getActiveStore();
  const [featured, newArrivals, categories, collections] = await Promise.all([
    getFeaturedProducts(store.id),
    getNewArrivals(store.id),
    listCategories(store.id),
    listCollections(store.id),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-16 px-6 py-12 sm:px-10 lg:px-16">
      <section className="flex flex-col items-center gap-3 py-12 text-center">
        {store.logo_url ? (
          <div className="relative h-24 w-48">
            <Image src={store.logo_url} alt={store.name} fill className="object-contain" sizes="192px" priority />
          </div>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-tight" style={{ color: "var(--brand-primary)" }}>
          {store.name}
        </h1>
        {store.description ? <p className="max-w-xl text-zinc-600">{store.description}</p> : null}
      </section>

      {categories.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Categorias</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${category.slug}`}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm hover:border-zinc-400"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {collections.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Coleções</h2>
          <div className="flex flex-wrap gap-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/colecoes/${collection.slug}`}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm hover:border-zinc-400"
              >
                {collection.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Lançamentos</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product) => (
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
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Destaques</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
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
        </section>
      ) : null}

      <div className="flex justify-center">
        <Link href="/produtos" className="text-sm font-medium underline underline-offset-4">
          Ver todos os produtos
        </Link>
      </div>
    </main>
  );
}
