import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllModelsForAdmin } from "@/lib/models/queries";
import { ModelForm } from "./model-form";
import { ModelRow } from "./model-row";
import { PageHeading } from "@/components/admin/page-heading";

export default async function AdminModelsPage() {
  const store = await getActiveStore();
  const models = await listAllModelsForAdmin(store.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        kicker="Organização"
        title="Modelos"
        description="O formato da peça: clutch, tote, transversal, mochila…"
      />

      <div className="mx-auto w-full max-w-md rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <ModelForm />
      </div>

      <div className="flex flex-col gap-3">
        {models.length === 0 ? (
          <p className="rounded-[var(--radius-image)] border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nenhum modelo cadastrado ainda.
          </p>
        ) : (
          models.map((model) => <ModelRow key={model.id} model={model} />)
        )}
      </div>
    </div>
  );
}
