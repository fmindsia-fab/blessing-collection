import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const store = await getActiveStore();
  const [categories, collections] = await Promise.all([
    listAllCategoriesForAdmin(store.id),
    listAllCollectionsForAdmin(store.id),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Novo produto</h1>
        <p className="text-sm text-zinc-600">
          Depois de salvar, você poderá enviar fotos e cadastrar variações na tela de edição.
        </p>
      </div>
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}
