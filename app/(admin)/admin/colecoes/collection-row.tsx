"use client";

import { useTransition } from "react";
import { archiveCollection, restoreCollection } from "@/lib/collections/actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/status-pill";
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
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-image)] border border-border bg-card px-5 py-4 shadow-sm transition-all duration-300 hover:border-foreground/25 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-brand)] text-base">{collection.name}</span>
        <span className="font-mono text-xs text-muted-foreground">/{collection.slug}</span>
      </div>
      <div className="flex items-center gap-3">
        {isArchived ? <StatusPill tone="muted">Arquivada</StatusPill> : null}
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
