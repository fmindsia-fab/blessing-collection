"use client";

import { useTransition } from "react";
import { archiveModel, restoreModel } from "@/lib/models/actions";
import { Button } from "@/components/ui/button";
import type { ArchivableStatus } from "@/types/database.types";

type ModelRowProps = {
  model: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: ArchivableStatus;
  };
};

export function ModelRow({ model }: ModelRowProps) {
  const [isPending, startTransition] = useTransition();
  const isArchived = model.status === "archived";

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">{model.name}</span>
        <span className="text-xs text-muted-foreground">/{model.slug}</span>
      </div>
      <div className="flex items-center gap-3">
        {isArchived ? (
          <span className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">Arquivado</span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isArchived ? restoreModel(model.id) : archiveModel(model.id)))
          }
        >
          {isArchived ? "Restaurar" : "Arquivar"}
        </Button>
      </div>
    </div>
  );
}
