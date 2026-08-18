import { getActiveStore } from "@/lib/store/get-active-store";
import { listMaterialsForAdmin } from "@/lib/pricing/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { MaterialsList } from "./materials-list";

export default async function MaterialsPage() {
  const store = await getActiveStore();
  const materials = await listMaterialsForAdmin(store.id);

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
