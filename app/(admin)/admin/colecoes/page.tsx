import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCollectionsForAdmin } from "@/lib/collections/queries";
import { CollectionForm } from "./collection-form";
import { CollectionRow } from "./collection-row";

export default async function AdminCollectionsPage() {
  const store = await getActiveStore();
  const collections = await listAllCollectionsForAdmin(store.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Coleções</h1>
        <p className="text-sm text-zinc-600">Agrupe produtos em coleções temáticas.</p>
      </div>

      <div className="max-w-md">
        <CollectionForm />
      </div>

      <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
        {collections.length === 0 ? (
          <p className="py-8 text-sm text-zinc-500">Nenhuma coleção cadastrada ainda.</p>
        ) : (
          collections.map((collection) => <CollectionRow key={collection.id} collection={collection} />)
        )}
      </div>
    </div>
  );
}
