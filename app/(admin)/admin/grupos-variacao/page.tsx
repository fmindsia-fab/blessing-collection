import { getOwnerStore } from "@/lib/store/get-owner-store";
import { listVariantGroups } from "@/lib/variant-groups/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { VariantGroupsList } from "./variant-groups-list";

export default async function VariantGroupsPage() {
  const store = await getOwnerStore();
  // Só ativos: a tela lista para editar/remover, e "removido" não deve
  // reaparecer aqui — mesmo padrão da tela de Materiais.
  const groups = await listVariantGroups(store.id);

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <PageHeading
        kicker="Organização"
        title="Grupos de variação"
        description="Cadastre os eixos de variação (Cor, Alça, Tamanho…) uma vez, e escolha entre eles ao cadastrar cada peça."
      />

      <section className="rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <VariantGroupsList groups={groups} />
      </section>
    </div>
  );
}
