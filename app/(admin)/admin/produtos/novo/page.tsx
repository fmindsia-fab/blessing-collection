import { getOwnerStore } from "@/lib/store/get-owner-store";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { listAllModelsForAdmin } from "@/lib/models/queries";
import { countActiveProducts, FREE_PLAN_PRODUCT_LIMIT } from "@/lib/products/limits";
import { ProductForm } from "../product-form";
import { PageHeading } from "@/components/admin/page-heading";
import { ActionLink } from "@/components/ui/action";

export default async function NewProductPage() {
  const store = await getOwnerStore();
  const [categories, collections, models, activeCount] = await Promise.all([
    listAllCategoriesForAdmin(store.id),
    listAllCollectionsForAdmin(store.id),
    listAllModelsForAdmin(store.id),
    countActiveProducts(store.id),
  ]);

  if (activeCount >= FREE_PLAN_PRODUCT_LIMIT) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <PageHeading kicker="Catálogo" title="Nova peça" />
        <div className="flex flex-col items-start gap-3 rounded-[var(--radius-image)] border border-[var(--gold)]/40 bg-[var(--gold)]/[0.07] p-6">
          <p className="text-sm text-foreground/85">
            Você atingiu o limite de {FREE_PLAN_PRODUCT_LIMIT} produtos do teste grátis. Desative um
            produto existente para liberar uma vaga.
          </p>
          <ActionLink href="/admin/produtos" variant="outline" className="h-10 px-5">
            Ver meus produtos
          </ActionLink>
        </div>
      </div>
    );
  }

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
