"use client";

import { useTransition } from "react";
import { archiveCollection, restoreCollection } from "@/lib/collections/actions";
import { Button } from "@/components/ui/button";
import type { ArchivableStatus } from "@/types/database.types";

type CollectionRowProps = {
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: ArchivableStatus;
  };
};

export function CollectionRow({ collection }: CollectionRowProps) {
  const [isPending, startTransition] = useTransition();
  const isArchived = collection.status === "archived";

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{collection.name}</span>
        <span className="text-xs text-zinc-500">/{collection.slug}</span>
      </div>
      <div className="flex items-center gap-3">
        {isArchived ? <span className="text-xs text-zinc-500">Arquivada</span> : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isArchived ? restoreCollection(collection.id) : archiveCollection(collection.id)))
          }
        >
          {isArchived ? "Restaurar" : "Arquivar"}
        </Button>
      </div>
    </div>
  );
}
