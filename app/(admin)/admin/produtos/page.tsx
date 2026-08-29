import { getOwnerStore } from "@/lib/store/get-owner-store";
import { listAllProductsForAdmin } from "@/lib/products/admin-queries";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { FREE_PLAN_PRODUCT_LIMIT } from "@/lib/products/limits";
import { PageHeading } from "@/components/admin/page-heading";
import { ActionLink } from "@/components/ui/action";
import { ProductSearch } from "./product-search";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
  inactive: "Inativo",
};

// inactive não conta para o limite do teste grátis — espelha
// lib/products/limits.ts (mesma regra, sem query extra: já temos o status
// de cada produto aqui).
const ACTIVE_STATUSES = new Set(["available", "made_to_order", "sold_out"]);

export default async function AdminProductsPage() {
  const store = await getOwnerStore();
  const [products, categories] = await Promise.all([
    listAllProductsForAdmin(store.id),
    listAllCategoriesForAdmin(store.id),
  ]);

  const activeCount = products.filter((p) => ACTIVE_STATUSES.has(p.status)).length;
  const atLimit = activeCount >= FREE_PLAN_PRODUCT_LIMIT;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        kicker="Catálogo"
        title="Produtos"
        description={`${activeCount} de ${FREE_PLAN_PRODUCT_LIMIT} produtos do teste grátis`}
        action={
          atLimit ? (
            <span className="flex h-11 cursor-not-allowed items-center rounded-full border border-border px-6 text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground/60">
              Limite atingido
            </span>
          ) : (
            <ActionLink href="/admin/produtos/novo" variant="solid" className="h-11 px-6">
              Nova peça
            </ActionLink>
          )
        }
      />

      {atLimit ? (
        <p className="rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold)]/[0.07] px-4 py-3 text-sm text-foreground/85">
          Você atingiu o limite de {FREE_PLAN_PRODUCT_LIMIT} produtos do teste grátis. Desative um
          produto existente para cadastrar um novo.
        </p>
      ) : null}

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
