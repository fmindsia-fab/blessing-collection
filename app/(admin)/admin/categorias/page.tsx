import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { CategoryForm } from "./category-form";
import { CategoryRow } from "./category-row";
import { PageHeading } from "@/components/admin/page-heading";

export default async function AdminCategoriesPage() {
  const store = await getActiveStore();
  const categories = await listAllCategoriesForAdmin(store.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        kicker="Organização"
        title="Categorias"
        description="Agrupe as peças do catálogo por categoria."
      />

      <div className="max-w-md">
        <CategoryForm />
      </div>

      <div className="flex flex-col divide-y divide-border border-y border-border">
        {categories.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          categories.map((category) => <CategoryRow key={category.id} category={category} />)
        )}
      </div>
    </div>
  );
}
