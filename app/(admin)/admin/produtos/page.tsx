import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllProductsForAdmin } from "@/lib/products/admin-queries";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { ActionLink } from "@/components/ui/action";
import { ProductRow } from "./product-row";
import { CategoryGroup } from "./category-group";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  made_to_order: "Sob encomenda",
  sold_out: "Esgotado",
  inactive: "Inativo",
};

const SEM_CATEGORIA = "__sem_categoria__";

export default async function AdminProductsPage() {
  const store = await getActiveStore();
  const [products, categories] = await Promise.all([
    listAllProductsForAdmin(store.id),
    listAllCategoriesForAdmin(store.id),
  ]);

  // Agrupa preservando a ordem de `sort_order` dentro de cada categoria — é a
  // ordem que as setas manipulam e a que o catálogo público exibe.
  const byCategory = new Map<string, typeof products>();
  for (const product of products) {
    const key = product.category_id ?? SEM_CATEGORIA;
    byCategory.set(key, [...(byCategory.get(key) ?? []), product]);
  }

  // Segue a ordem definida em Categorias; "Sem categoria" fecha a lista por ser
  // pendência de cadastro, não uma seção do catálogo.
  const groups = [
    ...categories
      .filter((category) => byCategory.has(category.id))
      .map((category) => ({
        key: category.id,
        name: category.name,
        items: byCategory.get(category.id)!,
      })),
    ...(byCategory.has(SEM_CATEGORIA)
      ? [{ key: SEM_CATEGORIA, name: "Sem categoria", items: byCategory.get(SEM_CATEGORIA)! }]
      : []),
  ];

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
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <CategoryGroup
              key={group.key}
              name={group.name}
              count={group.items.length}
              // "Sem categoria" abre fechado: é lembrete de pendência, não
              // conteúdo que a proprietária precisa ver toda vez.
              defaultOpen={group.key !== SEM_CATEGORIA}
            >
              {group.items.map((product, index) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  statusLabel={STATUS_LABEL[product.status]}
                  // Primeiro/último dentro do grupo: é entre vizinhos da mesma
                  // categoria que `moveProduct` troca as posições.
                  isFirst={index === 0}
                  isLast={index === group.items.length - 1}
                />
              ))}
            </CategoryGroup>
          ))}
        </div>
      )}
    </div>
  );
}
