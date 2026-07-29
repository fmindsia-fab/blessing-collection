"use client";

import { useTransition } from "react";
import { archiveCategory, restoreCategory } from "@/lib/categories/actions";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{category.name}</span>
        <span className="text-xs text-zinc-500">/{category.slug}</span>
      </div>
      <div className="flex items-center gap-3">
        {isArchived ? <span className="text-xs text-zinc-500">Arquivada</span> : null}
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
