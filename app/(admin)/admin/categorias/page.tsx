import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { CategoryForm } from "./category-form";
import { CategoryRow } from "./category-row";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { EmptyState } from "@/components/admin/empty-state";
import { FolderTreeIcon } from "lucide-react";

export default async function AdminCategoriesPage() {
  const store = await getActiveStore();
  const categories = await listAllCategoriesForAdmin(store.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeading
        kicker="Organização"
        title="Categorias"
        description="Agrupe as peças do catálogo por categoria."
      />

      <PageSection id="novo" title="Nova categoria">
        <CategoryForm />
      </PageSection>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Suas categorias{" "}
          <span className="text-sm font-normal text-muted-foreground">({categories.length})</span>
        </h2>
        {categories.length === 0 ? (
          <EmptyState icon={FolderTreeIcon}>Nenhuma categoria ainda. Cadastre a primeira acima, por exemplo: Bolsas, Acessórios.</EmptyState>
        ) : (
          categories.map((category) => <CategoryRow key={category.id} category={category} />)
        )}
      </section>
    </div>
  );
}
