import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { CollectionForm } from "./collection-form";
import { CollectionRow } from "./collection-row";
import { PageHeading } from "@/components/admin/page-heading";

export default async function AdminCollectionsPage() {
  const store = await getActiveStore();
  const collections = await listAllCollectionsForAdmin(store.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        kicker="Organização"
        title="Coleções"
        description="Reúna peças em coleções temáticas."
      />

      <div className="max-w-md">
        <CollectionForm />
      </div>

      <div className="flex flex-col divide-y divide-border border-y border-border">
        {collections.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">Nenhuma coleção cadastrada ainda.</p>
        ) : (
          collections.map((collection) => <CollectionRow key={collection.id} collection={collection} />)
        )}
      </div>
    </div>
  );
}
