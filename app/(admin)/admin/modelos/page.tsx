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

      <div className="max-w-md">
        <ModelForm />
      </div>

      <div className="flex flex-col divide-y divide-border border-y border-border">
        {models.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">Nenhum modelo cadastrado ainda.</p>
        ) : (
          models.map((model) => <ModelRow key={model.id} model={model} />)
        )}
      </div>
    </div>
  );
}
