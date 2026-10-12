"use client";

import { useState, useTransition } from "react";
import { setStoreStatus } from "@/lib/platform/actions";
import { Button } from "@/components/ui/button";

export function StoreStatusToggle({ storeId, status }: { storeId: string; status: "active" | "inactive" }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    const nextStatus = status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await setStoreStatus(storeId, nextStatus);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={status === "active" ? "destructive" : "default"}
        onClick={handleToggle}
        disabled={isPending}
      >
        {isPending ? "Atualizando..." : status === "active" ? "Suspender loja" : "Reativar loja"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
