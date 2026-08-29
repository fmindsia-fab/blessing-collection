import { getOwnerStore } from "@/lib/store/get-owner-store";
import { listAllProductsForAdmin } from "@/lib/products/admin-queries";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { ActionLink } from "@/components/ui/action";
import { ProductSearch } from "./product-search";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
  inactive: "Inativo",
};

export default async function AdminProductsPage() {
  const store = await getOwnerStore();
  const [products, categories] = await Promise.all([
    listAllProductsForAdmin(store.id),
    listAllCategoriesForAdmin(store.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        kicker="Catálogo"
        title="Produtos"
        description={`${products.length} ${products.length === 1 ? "peça cadastrada" : "peças cadastradas"}`}
        action={
          <ActionLink href="/admin/produtos/novo" variant="solid" className="h-11 px-6">
            Nova peça
          </ActionLink>
        }
      />

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-image)] border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma peça cadastrada ainda.</p>
          <ActionLink href="/admin/produtos/novo" variant="outline" className="h-11 px-6">
            Cadastrar a primeira
          </ActionLink>
        </div>
      ) : (
        <ProductSearch products={products} categories={categories} statusLabels={STATUS_LABEL} />
      )}
    </div>
  );
}
