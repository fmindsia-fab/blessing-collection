import { getActiveStore } from "@/lib/store/get-active-store";
import { listVariantGroups } from "@/lib/variant-groups/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { VariantGroupsList } from "./variant-groups-list";

export default async function VariantGroupsPage() {
  const store = await getActiveStore();
  // Só ativos: a tela lista para editar/remover, e "removido" não deve
  // reaparecer aqui — mesmo padrão da tela de Materiais.
  const groups = await listVariantGroups(store.id);

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <PageHeading
        kicker="Organização"
        title="Variações das peças"
        description="Cadastre uma vez as opções que a cliente pode escolher (Cor, Alça, Tamanho…) e use em cada peça."
      />

      <section className="rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <VariantGroupsList groups={groups} />
      </section>
    </div>
  );
}
