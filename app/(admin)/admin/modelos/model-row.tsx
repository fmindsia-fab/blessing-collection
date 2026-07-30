"use client";

import { useTransition } from "react";
import { archiveModel, restoreModel } from "@/lib/models/actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/status-pill";
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
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-image)] border border-border bg-card px-5 py-4 shadow-sm transition-all duration-300 hover:border-foreground/25 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-brand)] text-base">{model.name}</span>
        <span className="font-mono text-xs text-muted-foreground">/{model.slug}</span>
      </div>
      <div className="flex items-center gap-3">
        {isArchived ? <StatusPill tone="muted">Arquivado</StatusPill> : null}
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
