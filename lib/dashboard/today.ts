import { listOpenPayables, todayInStoreZone } from "@/lib/finance/queries";
import { payableStatus } from "@/lib/finance/calc";
import { listFollowups } from "@/lib/leads/queries";
import { followupStatus } from "@/lib/leads/calc";
import { stockLevel } from "@/lib/stock/calc";
import { listStockOverview } from "@/lib/stock/queries";
import type { TodayCardsData } from "@/components/admin/today-cards";

const EMPTY: TodayCardsData = {
  payables: { overdueCount: 0, todayCount: 0, total: 0 },
  lowStockCount: 0,
  followups: { todayCount: 0, overdueCount: 0 },
};

/** Avisos do dia para o Dashboard. Nunca derruba a página: qualquer falha vira "nada a avisar". */
export async function getTodayCardsData(storeId: string): Promise<TodayCardsData> {
  try {
    const today = todayInStoreZone();
    const [payables, stock, followups] = await Promise.all([listOpenPayables(storeId), listStockOverview(storeId), listFollowups(storeId)]);

    const due = payables.filter((payable) => {
      const status = payableStatus(payable, today);
      return status === "overdue" || status === "today";
    });

    return {
      payables: {
        overdueCount: due.filter((payable) => payable.dueDate < today).length,
        todayCount: due.filter((payable) => payable.dueDate === today).length,
        total: Math.round(due.reduce((sum, payable) => sum + payable.amount, 0) * 100) / 100,
      },
      lowStockCount: stock.filter((row) => ["negative", "empty", "low"].includes(stockLevel(row.stock, row.minStock, row.tracked))).length,
      followups: {
        todayCount: followups.filter((lead) => followupStatus(lead.nextFollowup, today) === "today").length,
        overdueCount: followups.filter((lead) => followupStatus(lead.nextFollowup, today) === "overdue").length,
      },
    };
  } catch (error) {
    console.error("getTodayCardsData falhou:", error);
    return EMPTY;
  }
}
