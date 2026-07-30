import Image from "next/image";
import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getFeaturedProducts, getNewArrivals } from "@/lib/products/queries";
import { listCategories } from "@/lib/categories/queries";
import { listCollections } from "@/lib/collections/queries";
import { ProductCard } from "@/components/catalog/product-card";
import { SectionHeading } from "@/components/catalog/section-heading";
import { ActionLink } from "@/components/ui/action";
import type { Metadata } from "next";

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
  const [featured, newArrivals, categories, collections] = await Promise.all([
    getFeaturedProducts(store.id),
    getNewArrivals(store.id),
    listCategories(store.id),
    listCollections(store.id),
  ]);

  // A primeira peça em destaque vira a imagem de capa do editorial.
  const heroProduct = featured[0] ?? newArrivals[0] ?? null;

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

        {categories.length > 0 ? (
          <section className="flex flex-col gap-8">
            <SectionHeading kicker="Navegue por" title="Categorias" />
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  className="group font-[family-name:var(--font-brand)] text-xl text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground sm:text-2xl"
                >
                  {category.name}
                  <span className="mt-1 block h-px w-0 bg-[var(--gold)] transition-all duration-500 ease-out group-hover:w-full group-focus-visible:w-full" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {collections.length > 0 ? (
          <section className="flex flex-col gap-8">
            <SectionHeading kicker="Reunidas em" title="Coleções" />
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/colecoes/${collection.slug}`}
                  className="group font-[family-name:var(--font-brand)] text-xl text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground sm:text-2xl"
                >
                  {collection.name}
                  <span className="mt-1 block h-px w-0 bg-[var(--gold)] transition-all duration-500 ease-out group-hover:w-full group-focus-visible:w-full" />
                </Link>
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
