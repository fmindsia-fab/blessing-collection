import { notFound } from "next/navigation";
import { Playfair_Display, Cormorant_Garamond, Dancing_Script } from "next/font/google";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getOrder } from "@/lib/orders/queries";
import { INVOICE_COUPON_PERCENT } from "@/lib/orders/build-invoice-message";
import { BackLink } from "@/components/shared/back-link";
import { ShareButton } from "@/components/shared/share-button";
import { ThankYouCard } from "./thank-you-card";

// Fontes fixas do cartão, independentes da fonte da marca configurada pela
// loja: o cartão é uma peça editorial própria (pergaminho/dourado/cursiva),
// não herda a identidade visual do catálogo/painel.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-card-display" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-card-body" });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-card-script" });

export default async function OrderThankYouPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const result = await getOrder(store.id, id);
  if (!result) notFound();

  const { order, items } = result;

  // Handle do Instagram a partir da URL, mesmo padrão de components/catalog/site-footer.tsx.
  const instagramHandle = store.instagram_url
    ? `@${store.instagram_url.replace(/\/+$/, "").split("/").pop()}`
    : null;

  const customerName = order.customer?.name ?? "Cliente";
  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/pedidos/${id}/agradecimento`;

  return (
    <div
      className={`${playfair.variable} ${cormorant.variable} ${dancingScript.variable} flex flex-col items-center gap-6 px-4 py-8`}
    >
      <div className="w-full max-w-xl">
        <BackLink href={`/admin/pedidos/${id}`}>Pedido</BackLink>
      </div>

      <p className="max-w-xl text-center text-xs text-muted-foreground">
        Abra esta página no navegador, tire um print da área do cartão abaixo e envie como imagem
        para a cliente pelo WhatsApp.
      </p>

      <ThankYouCard
        storeName={store.name}
        storeLogoUrl={store.logo_url ?? null}
        customerName={order.customer?.name ?? "Cliente"}
        items={items.map((item) => ({
          name: item.product?.name ?? item.custom_name ?? "Item",
          variantName: item.variant?.name ?? null,
          coverImageUrl: item.coverImageUrl,
        }))}
        couponCode={order.customer?.name ?? "Cliente"}
        couponPercent={INVOICE_COUPON_PERCENT}
        pixKey={store.pix_key ?? null}
        instagramHandle={instagramHandle}
      />

      <ShareButton
        url={pageUrl}
        title={`Cartão de agradecimento — ${customerName}`}
        variant="outline"
        label="Compartilhar"
      />
    </div>
  );
}
