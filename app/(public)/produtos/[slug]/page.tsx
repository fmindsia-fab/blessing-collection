import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductBySlug } from "@/lib/products/queries";
import { WhatsappButton } from "@/components/catalog/whatsapp-button";
import { SelectionToggleButton } from "@/components/catalog/selection-toggle-button";
import { PageViewTracker } from "@/components/shared/page-view-tracker";
import { BackLink } from "@/components/shared/back-link";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Alimenta o preview de link do WhatsApp/Instagram (miniatura + título) e o SEO.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getActiveStore();
  const result = await getProductBySlug(store.id, slug);

  if (!result) return { title: "Produto não encontrado" };

  const { product, images } = result;
  const coverImage = images.find((img) => img.is_cover) ?? images[0] ?? null;

  const title = product.seo_title || `${product.name} | ${store.name}`;
  const description =
    product.seo_description || product.description || `${product.name} — ${formatPrice(product.price)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/produtos/${product.slug}`,
      siteName: store.name,
      images: coverImage ? [{ url: coverImage.url, alt: coverImage.alt_text ?? product.name }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getActiveStore();
  const result = await getProductBySlug(store.id, slug);

  if (!result) notFound();

  const { product, images, variants } = result;

  const coverImage = images.find((img) => img.is_cover) ?? images[0] ?? null;
  const otherImages = images.filter((img) => img.id !== coverImage?.id);

  const variantPrices = variants.map((v) => v.price).filter((p): p is number => p != null);
  const hasVariantPricing = variantPrices.length > 0;
  const displayPrice = hasVariantPricing ? Math.min(product.price, ...variantPrices) : product.price;

  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/produtos/${product.slug}`;

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16">
      <PageViewTracker storeId={store.id} eventType="product_view" productId={product.id} />

      <BackLink href="/produtos">Voltar para produtos</BackLink>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="reveal flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
            {coverImage ? (
              <Image
                src={coverImage.url}
                alt={coverImage.alt_text ?? product.name}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
            ) : null}
          </div>
          {otherImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {otherImages.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden bg-secondary">
                  <Image
                    src={img.url}
                    alt={img.alt_text ?? product.name}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    sizes="14vw"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className="reveal flex flex-col gap-8 lg:sticky lg:top-12 lg:self-start"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-col gap-3">
            {product.status !== "available" ? (
              <span className="kicker text-[var(--gold)]">{STATUS_LABEL[product.status]}</span>
            ) : null}
            <h1 className="font-[family-name:var(--font-brand)] text-[2.5rem] leading-[1.05] tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="flex items-baseline gap-2 text-xl">
              {hasVariantPricing ? <span className="kicker normal-case">a partir de</span> : null}
              {formatPrice(displayPrice)}
            </p>
          </div>

          {product.description ? (
            <p className="max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          {product.materials || product.measurements ? (
            <dl className="flex flex-col divide-y divide-border border-y border-border text-sm">
              {product.materials ? (
                <div className="flex gap-6 py-3">
                  <dt className="kicker w-28 shrink-0 pt-0.5">Materiais</dt>
                  <dd className="text-muted-foreground">{product.materials}</dd>
                </div>
              ) : null}
              {product.measurements ? (
                <div className="flex gap-6 py-3">
                  <dt className="kicker w-28 shrink-0 pt-0.5">Medidas</dt>
                  <dd className="text-muted-foreground">{product.measurements}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {variants.length > 0 ? (
            <div className="flex flex-col gap-3">
              <span className="kicker">Variações</span>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <span
                    key={variant.id}
                    className={`border px-3.5 py-1.5 text-xs tracking-wide ${
                      variant.status === "sold_out"
                        ? "border-border text-muted-foreground/60 line-through"
                        : "border-foreground/25 text-foreground"
                    }`}
                  >
                    {variant.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <WhatsappButton
              storeId={store.id}
              storeName={store.name}
              storeWhatsapp={store.whatsapp_number}
              productId={product.id}
              productName={product.name}
              productUrl={productUrl}
              status={product.status}
            />
            <SelectionToggleButton
              item={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                // Mesmo "a partir de" do card: menor entre preço base e variantes.
                price: displayPrice,
                priceIsFrom: hasVariantPricing,
                status: product.status,
                coverImageUrl: coverImage?.url ?? null,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
