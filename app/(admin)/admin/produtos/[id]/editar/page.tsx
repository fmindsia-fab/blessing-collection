import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductForAdmin } from "@/lib/products/admin-queries";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { ProductForm } from "../../product-form";
import { ProductImages } from "./product-images";
import { ProductVariants } from "./product-variants";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();

  const [result, categories, collections] = await Promise.all([
    getProductForAdmin(store.id, id),
    listAllCategoriesForAdmin(store.id),
    listAllCollectionsForAdmin(store.id),
  ]);

  if (!result) notFound();

  const { product, images, variants } = result;

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Editar produto</h1>
        <p className="text-sm text-zinc-600">{product.name}</p>
      </div>

      <ProductForm categories={categories} collections={collections} product={product} />

      <ProductImages productId={product.id} images={images} />

      <ProductVariants productId={product.id} variants={variants} />
    </div>
  );
}
