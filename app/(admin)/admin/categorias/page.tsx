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

      <div className="mx-auto w-full max-w-md rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <CategoryForm />
      </div>

      <div className="flex flex-col gap-3">
        {categories.length === 0 ? (
          <p className="rounded-[var(--radius-image)] border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nenhuma categoria cadastrada ainda.
          </p>
        ) : (
          categories.map((category) => <CategoryRow key={category.id} category={category} />)
        )}
      </div>
    </div>
  );
}
