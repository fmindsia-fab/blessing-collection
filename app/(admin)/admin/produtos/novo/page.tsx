import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { listAllModelsForAdmin } from "@/lib/models/queries";
import { ProductForm } from "../product-form";
import { PageHeading } from "@/components/admin/page-heading";

export default async function NewProductPage() {
  const store = await getActiveStore();
  const [categories, collections, models] = await Promise.all([
    listAllCategoriesForAdmin(store.id),
    listAllCollectionsForAdmin(store.id),
    listAllModelsForAdmin(store.id),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PageHeading
        kicker="Catálogo"
        title="Nova peça"
        description="Depois de salvar, você poderá enviar fotos e cadastrar variações na tela de edição."
      />
      <ProductForm categories={categories} collections={collections} models={models} />
    </div>
  );
}
