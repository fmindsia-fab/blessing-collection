import { notFound } from "next/navigation";
import { getOwnerStore } from "@/lib/store/get-owner-store";
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
import { ProductImages } from "./product-images";
import { ProductVideo } from "./product-video";
import { ProductSlug } from "./product-slug";
import { ProductVariants } from "./product-variants";
import { ProductPricing } from "./product-pricing";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getOwnerStore();

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
    <div className="flex max-w-2xl flex-col gap-10">
      <PageHeading kicker="Catálogo" title="Editar peça" description={product.name} />

      <ProductSlug productId={product.id} name={product.name} slug={product.slug} />

      <ProductForm
        categories={categories}
        collections={collections}
        models={models}
        product={product}
      />

      <ProductImages productId={product.id} images={images} />

      <ProductVideo
        productId={product.id}
        storeId={store.id}
        videoUrl={product.video_url}
        videoPosterUrl={product.video_poster_url}
      />

      <ProductVariants
        productId={product.id}
        variants={variants}
        colors={colors}
        catalogGroups={variantGroups.map((g) => g.name)}
        businessType={store.business_type}
      />

      <div className="border-t border-border pt-10">
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
      </div>
    </div>
  );
}
