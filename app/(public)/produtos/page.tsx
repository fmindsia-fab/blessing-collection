import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listProducts } from "@/lib/products/queries";
import { ProductCard } from "@/components/catalog/product-card";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; busca?: string }>;
}) {
  const { page: pageParam, busca } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const store = await getActiveStore();
  const { products, total, hasMore } = await listProducts({
    storeId: store.id,
    page,
    search: busca,
  });

  const isEmpty = products.length === 0;

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
        <p className="text-sm text-zinc-600">{total} produtos encontrados</p>
      </div>

      <form className="max-w-sm">
        <input
          type="search"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome..."
          className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </form>

      {isEmpty ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          Nenhum produto encontrado{busca ? ` para "${busca}"` : ""}.
        </p>
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
          <Link
            href={`/produtos?page=${page + 1}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`}
            className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium hover:border-zinc-500"
          >
            Carregar mais
          </Link>
        </div>
      ) : null}
    </main>
  );
}
