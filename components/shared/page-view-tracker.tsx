"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventType } from "@/types/database.types";

type PageViewTrackerProps = {
  storeId: string;
  eventType: Extract<AnalyticsEventType, "product_view" | "category_view" | "collection_view">;
  productId?: string;
  categoryId?: string;
  collectionId?: string;
};

// Componente invisível: dispara o evento de visualização uma vez ao montar.
export function PageViewTracker({ storeId, eventType, productId, categoryId, collectionId }: PageViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    track({ storeId, eventType, productId, categoryId, collectionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
