import { notFound } from "next/navigation";
import Image from "next/image";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductBySlug } from "@/lib/products/queries";
import { WhatsappButton } from "@/components/catalog/whatsapp-button";
import { PageViewTracker } from "@/components/shared/page-view-tracker";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-zinc-100">
            {coverImage ? (
              <Image
                src={coverImage.url}
                alt={coverImage.alt_text ?? product.name}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            ) : null}
          </div>
          {otherImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {otherImages.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                  <Image
                    src={img.url}
                    alt={img.alt_text ?? product.name}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {product.status !== "available" ? (
              <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {STATUS_LABEL[product.status]}
              </span>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <p className="text-lg text-zinc-900">
              {hasVariantPricing ? "A partir de " : ""}
              {formatPrice(displayPrice)}
            </p>
          </div>

          {product.description ? <p className="text-sm leading-relaxed text-zinc-600">{product.description}</p> : null}

          <dl className="flex flex-col gap-2 text-sm text-zinc-600">
            {product.materials ? (
              <div className="flex gap-2">
                <dt className="font-medium text-zinc-900">Materiais:</dt>
                <dd>{product.materials}</dd>
              </div>
            ) : null}
            {product.measurements ? (
              <div className="flex gap-2">
                <dt className="font-medium text-zinc-900">Medidas:</dt>
                <dd>{product.measurements}</dd>
              </div>
            ) : null}
          </dl>

          {variants.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-900">Variações</span>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <span
                    key={variant.id}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      variant.status === "sold_out"
                        ? "border-zinc-200 text-zinc-400 line-through"
                        : "border-zinc-300 text-zinc-900"
                    }`}
                  >
                    {variant.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <WhatsappButton
            storeId={store.id}
            storeName={store.name}
            storeWhatsapp={store.whatsapp_number}
            productId={product.id}
            productName={product.name}
            productUrl={productUrl}
            status={product.status}
            className="w-fit"
          />
        </div>
      </div>
    </main>
  );
}
