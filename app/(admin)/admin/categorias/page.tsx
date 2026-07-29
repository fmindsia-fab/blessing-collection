import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { CategoryForm } from "./category-form";
import { CategoryRow } from "./category-row";

export default async function AdminCategoriesPage() {
  const store = await getActiveStore();
  const categories = await listAllCategoriesForAdmin(store.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-sm text-zinc-600">Organize os produtos do catálogo por categoria.</p>
      </div>

      <div className="max-w-md">
        <CategoryForm />
      </div>

      <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
        {categories.length === 0 ? (
          <p className="py-8 text-sm text-zinc-500">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          categories.map((category) => <CategoryRow key={category.id} category={category} />)
        )}
      </div>
    </div>
  );
}
