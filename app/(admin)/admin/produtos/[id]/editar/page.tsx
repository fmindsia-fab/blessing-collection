import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductForAdmin } from "@/lib/products/admin-queries";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { listAllModelsForAdmin } from "@/lib/models/queries";
import { listColors } from "@/lib/colors/queries";
import { listVariantGroups } from "@/lib/variant-groups/queries";
import {
  getStorePricingSettings,
  listActiveMaterials,
  listPaymentMethods,
  listProductMaterials,
} from "@/lib/pricing/queries";
import { ProductForm } from "../../product-form";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { ProductImages } from "./product-images";
import { ProductVideo } from "./product-video";
import { ProductSlug } from "./product-slug";
import { ProductVariants } from "./product-variants";
import { ProductPricing } from "./product-pricing";

const SECTION_LINKS = [
  { id: "dados", label: "Dados" },
  { id: "fotos", label: "Fotos" },
  { id: "video", label: "Vídeo" },
  { id: "variacoes", label: "Variações" },
  { id: "preco", label: "Formação de preço" },
];

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();

  const [
    result,
    categories,
    collections,
    models,
    colors,
    variantGroups,
    pricing,
    paymentMethods,
    materials,
    catalogMaterials,
  ] = await Promise.all([
    getProductForAdmin(store.id, id),
    listAllCategoriesForAdmin(store.id),
    listAllCollectionsForAdmin(store.id),
    listAllModelsForAdmin(store.id),
    listColors(store.id),
    listVariantGroups(store.id),
    getStorePricingSettings(store.id),
    listPaymentMethods(store.id),
    listProductMaterials(id),
    listActiveMaterials(store.id),
  ]);

  if (!result) notFound();

  const { product, images, variants } = result;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeading kicker="Catálogo" title="Editar peça" description={product.name} />

      <nav aria-label="Seções da peça" className="flex flex-wrap gap-2">
        {SECTION_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:border-[var(--gold)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <PageSection id="dados" title="Dados da peça">
        <div className="flex flex-col gap-6">
          <ProductSlug productId={product.id} name={product.name} slug={product.slug} />
          <ProductForm
            categories={categories}
            collections={collections}
            models={models}
            product={product}
          />
        </div>
      </PageSection>

      <PageSection id="fotos">
        <ProductImages productId={product.id} images={images} />
      </PageSection>

      <PageSection id="video">
        <ProductVideo
          productId={product.id}
          storeId={store.id}
          videoUrl={product.video_url}
          videoPosterUrl={product.video_poster_url}
        />
      </PageSection>

      <PageSection id="variacoes">
        <ProductVariants
          productId={product.id}
          variants={variants}
          colors={colors}
          catalogGroups={variantGroups.map((g) => g.name)}
        />
      </PageSection>

      <PageSection id="preco">
        <ProductPricing
          productId={product.id}
          currentPrice={product.price}
          productionHours={product.production_hours}
          otherCosts={product.other_costs}
          pricingMethod={product.pricing_method}
          pricingRatePercent={product.pricing_rate_percent}
          materials={materials}
          catalogMaterials={catalogMaterials}
          rates={pricing.rates}
          paymentMethods={paymentMethods}
          taxBasisPoints={pricing.taxBasisPoints}
          storeDefaultMethod={pricing.defaultMethod}
          storeDefaultRate={pricing.defaultRatePercent}
          hasLaborConfigured={pricing.rates.totalPerHourCents > 0}
        />
      </PageSection>
    </div>
  );
}
