import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllModelsForAdmin } from "@/lib/models/queries";
import { ModelForm } from "./model-form";
import { ModelRow } from "./model-row";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { EmptyState } from "@/components/admin/empty-state";
import { ShapesIcon } from "lucide-react";

export default async function AdminModelsPage() {
  const store = await getActiveStore();
  const models = await listAllModelsForAdmin(store.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeading
        kicker="Organização"
        title="Modelos"
        description="O formato da peça: clutch, tote, transversal, mochila…"
      />

      <PageSection id="novo" title="Novo modelo">
        <ModelForm />
      </PageSection>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Seus modelos{" "}
          <span className="text-sm font-normal text-muted-foreground">({models.length})</span>
        </h2>
        {models.length === 0 ? (
          <EmptyState icon={ShapesIcon}>Nenhum modelo ainda. Cadastre o primeiro acima, por exemplo: tote, clutch, mochila.</EmptyState>
        ) : (
          models.map((model) => <ModelRow key={model.id} model={model} />)
        )}
      </section>
    </div>
  );
}
