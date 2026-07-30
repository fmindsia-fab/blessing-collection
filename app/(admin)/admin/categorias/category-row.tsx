"use client";

import { useTransition } from "react";
import { archiveCategory, restoreCategory } from "@/lib/categories/actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/status-pill";
import type { ArchivableStatus } from "@/types/database.types";

type CategoryRowProps = {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: ArchivableStatus;
  };
};

export function CategoryRow({ category }: CategoryRowProps) {
  const [isPending, startTransition] = useTransition();
  const isArchived = category.status === "archived";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-image)] border border-border bg-card px-5 py-4 shadow-sm transition-all duration-300 hover:border-foreground/25 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-brand)] text-base">{category.name}</span>
        <span className="font-mono text-xs text-muted-foreground">/{category.slug}</span>
      </div>
      <div className="flex items-center gap-3">
        {isArchived ? <StatusPill tone="muted">Arquivada</StatusPill> : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isArchived ? restoreCategory(category.id) : archiveCategory(category.id)))
          }
        >
          {isArchived ? "Restaurar" : "Arquivar"}
        </Button>
      </div>
    </div>
  );
}
