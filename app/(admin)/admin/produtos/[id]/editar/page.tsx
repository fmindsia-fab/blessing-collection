import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductForAdmin } from "@/lib/products/admin-queries";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { listAllModelsForAdmin } from "@/lib/models/queries";
import { listColors } from "@/lib/colors/queries";
import { ProductForm } from "../../product-form";
import { PageHeading } from "@/components/admin/page-heading";
import { ProductImages } from "./product-images";
import { ProductSlug } from "./product-slug";
import { ProductVariants } from "./product-variants";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();

  const [result, categories, collections, models, colors] = await Promise.all([
    getProductForAdmin(store.id, id),
    listAllCategoriesForAdmin(store.id),
    listAllCollectionsForAdmin(store.id),
    listAllModelsForAdmin(store.id),
    listColors(store.id),
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

      <ProductVariants productId={product.id} variants={variants} colors={colors} />
    </div>
  );
}
