import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { CollectionForm } from "./collection-form";
import { CollectionRow } from "./collection-row";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { EmptyState } from "@/components/admin/empty-state";
import { LayersIcon } from "lucide-react";

export default async function AdminCollectionsPage() {
  const store = await getActiveStore();
  const collections = await listAllCollectionsForAdmin(store.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeading
        kicker="Organização"
        title="Coleções"
        description="Reúna peças em coleções temáticas."
      />

      <PageSection id="novo" title="Nova coleção">
        <CollectionForm />
      </PageSection>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Suas coleções{" "}
          <span className="text-sm font-normal text-muted-foreground">({collections.length})</span>
        </h2>
        {collections.length === 0 ? (
          <EmptyState icon={LayersIcon}>Nenhuma coleção ainda. Cadastre a primeira acima, por exemplo: Festa, Verão.</EmptyState>
        ) : (
          collections.map((collection) => <CollectionRow key={collection.id} collection={collection} />)
        )}
      </section>
    </div>
  );
}
