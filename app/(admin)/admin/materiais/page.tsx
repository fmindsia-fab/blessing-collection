import { getOwnerStore } from "@/lib/store/get-owner-store";
import { listActiveMaterials } from "@/lib/pricing/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { MaterialsList } from "./materials-list";

export default async function MaterialsPage() {
  const store = await getOwnerStore();
  // Só ativos: a tela lista para editar/remover, e "removido" não deve
  // reaparecer aqui — regra explícita da proprietária.
  const materials = await listActiveMaterials(store.id);

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <PageHeading
        kicker="Financeiro"
        title="Materiais"
        description="Cadastre fio, fecho, etiqueta, alça… uma vez, e reaproveite o preço em toda peça que usa."
      />

      <section className="rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <MaterialsList materials={materials} />
      </section>
    </div>
  );
}
