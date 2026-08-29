import Image from "next/image";
import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products/queries";
import { listCategories } from "@/lib/categories/queries";
import { listCollections } from "@/lib/collections/queries";
import { pickHeroProduct } from "@/lib/catalog/hero";
import { pickCategoryCovers, pickCollectionCovers } from "@/lib/catalog/group-covers";
import { ProductCard } from "@/components/catalog/product-card";
import { VitrineCard } from "@/components/catalog/vitrine-card";
import { SectionHeading } from "@/components/catalog/section-heading";
import { ActionLink } from "@/components/ui/action";
import type { Metadata } from "next";

// A capa é sorteada a cada visita: sem isto o Next poderia servir uma versão
// em cache e todo mundo veria a mesma peça. Hoje a rota já é dinâmica porque o
// cliente Supabase lê cookies, mas depender disso deixaria o sorteio congelar
// silenciosamente se essa leitura mudasse.
export const dynamic = "force-dynamic";

// Título e preview de compartilhamento da home — antes herdava o metadata
// genérico do layout raiz, sem imagem nem descrição da loja.
export async function generateMetadata(): Promise<Metadata> {
  const store = await getActiveStore();
  const description =
    store.description ?? `Catálogo de bolsas e acessórios artesanais da ${store.name}.`;

  return {
    title: `${store.name} | Bolsas e acessórios artesanais`,
    description,
    openGraph: {
      title: store.name,
      description,
      type: "website",
      siteName: store.name,
      url: process.env.NEXT_PUBLIC_SITE_URL,
      images: store.logo_url ? [{ url: store.logo_url, alt: store.name }] : [],
    },
  };
}

export default async function HomePage() {
  const store = await getActiveStore();
  const [featured, newArrivals, categories, collections, categoryCovers, collectionCovers] =
    await Promise.all([
      getFeaturedProducts(store.id),
      getNewArrivals(store.id),
      listCategories(store.id),
      listCollections(store.id),
      pickCategoryCovers(store.id),
      pickCollectionCovers(store.id),
    ]);

  // A capa sorteia entre destaques e lançamentos a cada visita: quem volta ao
  // catálogo vê uma peça diferente em vez da mesma foto sempre.
  const heroProduct = pickHeroProduct(featured, newArrivals);

  return (
    <main className="flex flex-1 flex-col">
      {/* CAPA — assimétrica: texto à esquerda, fotografia sangrando à direita. */}
      <section className="grid grid-cols-1 items-center gap-10 px-6 pb-20 pt-14 sm:px-10 lg:grid-cols-[0.85fr_1fr] lg:gap-16 lg:px-16 lg:pb-28 lg:pt-20">
        {/* Centralizado no mobile (coluna única), alinhado à esquerda a partir
            do desktop, onde a assimetria com a foto é o que dá o ar editorial. */}
        <div className="reveal flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          {store.logo_url ? (
            <div className="relative h-16 w-40">
              <Image
                src={store.logo_url}
                alt={store.name}
                fill
                className="object-contain lg:object-left"
                sizes="160px"
                priority
              />
            </div>
          ) : null}

          <span className="kicker">Bolsas e acessórios artesanais</span>

          <h1 className="font-[family-name:var(--font-brand)] text-[2.75rem] leading-[0.95] tracking-tight sm:text-6xl lg:text-[4.25rem]">
            {store.name}
          </h1>

          {store.description ? (
            <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">{store.description}</p>
          ) : null}

          <ActionLink href="/produtos" variant="underline" arrow className="mt-2">
            Explorar o catálogo
          </ActionLink>
        </div>

        {heroProduct?.cover_image_url ? (
          <Link
            href={`/produtos/${heroProduct.slug}`}
            className="reveal group relative block aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-image)] bg-secondary shadow-md transition-shadow duration-500 hover:shadow-xl lg:aspect-[4/4.4]"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src={heroProduct.cover_image_url}
              alt={heroProduct.name}
              fill
              priority
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 55vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-foreground/55 to-transparent p-6 pt-16">
              <span className="font-[family-name:var(--font-brand)] text-lg text-background">
                {heroProduct.name}
              </span>
              <span className="text-[0.625rem] uppercase tracking-[0.18em] text-background/85">Ver peça</span>
            </div>
          </Link>
        ) : null}
      </section>

      <div className="flex flex-col gap-20 px-6 pb-24 sm:px-10 lg:gap-28 lg:px-16">
        {categories.length > 0 || collections.length > 0 ? (
          <section className="reveal flex flex-col gap-14" style={{ animationDelay: "180ms" }}>
            {categories.length > 0 ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="kicker">Navegue por</span>
                  <h2 className="font-[family-name:var(--font-brand)] text-2xl tracking-tight sm:text-[1.75rem]">
                    Categorias
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                  {categories.map((category) => (
                    <VitrineCard
                      key={category.id}
                      href={`/categorias/${category.slug}`}
                      name={category.name}
                      coverImageUrl={categoryCovers.get(category.id) ?? null}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {collections.length > 0 ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="kicker">Reunidas em</span>
                  <h2 className="font-[family-name:var(--font-brand)] text-2xl tracking-tight sm:text-[1.75rem]">
                    Coleções
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {collections.map((collection) => (
                    <VitrineCard
                      key={collection.id}
                      href={`/colecoes/${collection.slug}`}
                      name={collection.name}
                      coverImageUrl={collectionCovers.get(collection.id) ?? null}
                      tall
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {newArrivals.length > 0 ? (
          <section className="flex flex-col gap-8">
            <SectionHeading kicker="Recém-chegadas" title="Lançamentos" href="/produtos" />
            {/* auto-fill com largura máxima: com 2 itens a grade não estica os
                cards até metade da tela, mantendo a proporção editorial. */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] lg:gap-x-8">
              {newArrivals.map((product, index) => (
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
          </section>
        ) : null}

        {featured.length > 0 ? (
          <section className="flex flex-col gap-8">
            <SectionHeading kicker="Seleção da casa" title="Destaques" href="/produtos" />
            {/* auto-fill com largura máxima: com 2 itens a grade não estica os
                cards até metade da tela, mantendo a proporção editorial. */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] lg:gap-x-8">
              {featured.map((product, index) => (
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
          </section>
        ) : null}

        <div className="flex justify-center border-t border-border pt-14">
          <ActionLink href="/produtos" variant="underline" arrow>
            Ver todas as peças
          </ActionLink>
        </div>
      </div>
    </main>
  );
}
