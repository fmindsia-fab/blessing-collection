import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllProductsForAdmin } from "@/lib/products/admin-queries";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-zinc-600">{products.length} produtos cadastrados</p>
        </div>
        <Button render={<Link href="/admin/produtos/novo" />}>Novo produto</Button>
      </div>

      {products.length === 0 ? (
        <p className="py-8 text-sm text-zinc-500">Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
          {products.map((product) => (
            <ProductRow key={product.id} product={product} statusLabel={STATUS_LABEL[product.status]} />
          ))}
        </div>
      )}
    </div>
  );
}
