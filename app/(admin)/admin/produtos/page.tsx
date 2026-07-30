import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllProductsForAdmin } from "@/lib/products/admin-queries";
import { PageHeading } from "@/components/admin/page-heading";
import { ProductRow } from "./product-row";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
  inactive: "Inativo",
};

export default async function AdminProductsPage() {
  const store = await getActiveStore();
  const products = await listAllProductsForAdmin(store.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        kicker="Catálogo"
        title="Produtos"
        description={`${products.length} ${products.length === 1 ? "peça cadastrada" : "peças cadastradas"}`}
        action={
          <Link
            href="/admin/produtos/novo"
            className="inline-flex items-center bg-foreground px-6 py-3 text-[0.6875rem] uppercase tracking-[0.14em] text-background transition-colors hover:bg-[var(--gold)]"
          >
            Nova peça
          </Link>
        }
      />

      {products.length === 0 ? (
        <p className="py-12 text-sm text-muted-foreground">Nenhuma peça cadastrada ainda.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {products.map((product) => (
            <ProductRow key={product.id} product={product} statusLabel={STATUS_LABEL[product.status]} />
          ))}
        </div>
      )}
    </div>
  );
}
