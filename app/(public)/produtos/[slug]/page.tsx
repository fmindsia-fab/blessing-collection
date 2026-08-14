import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductBySlug, getRelatedProducts } from "@/lib/products/queries";
import { listPaymentMethods } from "@/lib/pricing/queries";
import { ProductCard } from "@/components/catalog/product-card";
import { SectionHeading } from "@/components/catalog/section-heading";
import { ProductDetails } from "@/components/catalog/product-details";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductPurchase } from "@/components/catalog/product-purchase";
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

  const [related, paymentMethods] = await Promise.all([
    getRelatedProducts(store.id, product),
    listPaymentMethods(store.id),
  ]);

  const coverImage = images.find((img) => img.is_cover) ?? images[0] ?? null;
  // A capa abre a galeria; as demais seguem na ordem definida no painel.
  const galleryImages = coverImage
    ? [coverImage, ...images.filter((img) => img.id !== coverImage.id)]
    : images;

  // O preço exibido depende da variação escolhida, então o cálculo vive em
  // ProductPurchase, que é quem tem esse estado.
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/produtos/${product.slug}`;

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16">
      <PageViewTracker storeId={store.id} eventType="product_view" productId={product.id} />

      <BackLink href="/produtos">Voltar para produtos</BackLink>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="reveal">
          <ProductGallery images={galleryImages} productName={product.name} />
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
          </div>

          {/* Preço, variações e ações num componente só: escolher a variação
              precisa atualizar o valor, o parcelamento, a mensagem do WhatsApp
              e o que vai para a seleção — tudo depende da mesma escolha. */}
          <ProductPurchase
            storeId={store.id}
            storeName={store.name}
            storeWhatsapp={store.whatsapp_number}
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            productUrl={productUrl}
            status={product.status}
            basePrice={product.price}
            variants={variants}
            coverImageUrl={coverImage?.url ?? null}
            paymentMethods={paymentMethods}
          />

          {product.description ? (
            <p className="max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          {product.materials ? (
            <dl className="flex flex-col divide-y divide-border border-y border-border text-sm">
              {product.materials ? (
                <div className="flex gap-6 py-3">
                  <dt className="kicker w-28 shrink-0 pt-0.5">Materiais</dt>
                  <dd className="text-muted-foreground">{product.materials}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <ProductDetails
            weightKg={product.weight_kg}
            lengthCm={product.length_cm}
            widthCm={product.width_cm}
            heightCm={product.height_cm}
          />
        </div>
      </div>

      {related.length > 0 ? (
        <section className="flex flex-col gap-8 border-t border-border pt-16">
          <SectionHeading kicker="Talvez você goste" title="Outras peças" href="/produtos" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] lg:gap-x-8">
            {related.map((item, index) => (
              <ProductCard
                key={item.id}
                index={index}
                slug={item.slug}
                name={item.name}
                price={item.price}
                status={item.status as typeof product.status}
                coverImageUrl={item.cover_image_url}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
