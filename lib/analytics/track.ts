"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AnalyticsEventType } from "@/types/database.types";

type TrackParams = {
  storeId: string;
  eventType: AnalyticsEventType;
  productId?: string;
  categoryId?: string;
  collectionId?: string;
};

// Fire-and-forget: nunca aguardar nem lançar erro para a UI.
// Falha no registro de analytics não pode impedir a navegação (PRD seção 6.7/15).
export function track(params: TrackParams) {
  const supabase = createBrowserSupabaseClient();

  supabase
    .from("analytics_events")
    .insert({
      store_id: params.storeId,
      event_type: params.eventType,
      product_id: params.productId ?? null,
      category_id: params.categoryId ?? null,
      collection_id: params.collectionId ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn("[analytics] falha ao registrar evento", error.message);
    });
}
