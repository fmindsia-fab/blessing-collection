import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LeadSource, LeadStage } from "@/types/database.types";

export type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  source: LeadSource;
  interest: string | null;
  stage: LeadStage;
  estimatedValue: number;
  nextFollowup: string | null;
  lostReason: string | null;
  notes: string | null;
  customerId: string | null;
  orderId: string | null;
  stageChangedAt: string;
  createdAt: string;
};

const LEAD_COLUMNS =
  "id, name, phone, source, interest, stage, estimated_value, next_followup, lost_reason, notes, customer_id, order_id, stage_changed_at, created_at";

type LeadDbRow = {
  id: string;
  name: string;
  phone: string | null;
  source: LeadSource;
  interest: string | null;
  stage: LeadStage;
  estimated_value: number;
  next_followup: string | null;
  lost_reason: string | null;
  notes: string | null;
  customer_id: string | null;
  order_id: string | null;
  stage_changed_at: string;
  created_at: string;
};

function toLeadRow(row: LeadDbRow): LeadRow {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    source: row.source,
    interest: row.interest,
    stage: row.stage,
    estimatedValue: Number(row.estimated_value),
    nextFollowup: row.next_followup,
    lostReason: row.lost_reason,
    notes: row.notes,
    customerId: row.customer_id,
    orderId: row.order_id,
    stageChangedAt: row.stage_changed_at,
    createdAt: row.created_at,
  };
}

/** Contatos ativos da loja: os em andamento e os decididos recentemente (últimos 90 dias). */
export async function listLeads(storeId: string): Promise<LeadRow[]> {
  const supabase = await createServerSupabaseClient();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: open }, { data: decided }] = await Promise.all([
    supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("store_id", storeId)
      .eq("status", "active")
      .in("stage", ["new", "talking", "quoted"])
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("store_id", storeId)
      .eq("status", "active")
      .in("stage", ["won", "lost"])
      .gte("stage_changed_at", since)
      .order("stage_changed_at", { ascending: false })
      .limit(300),
  ]);

  return [...(open ?? []), ...(decided ?? [])].map(toLeadRow);
}

export async function getLead(storeId: string, leadId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: lead } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("store_id", storeId)
    .eq("id", leadId)
    .eq("status", "active")
    .maybeSingle();
  if (!lead) return null;

  const { data: events } = await supabase
    .from("lead_events")
    .select("id, from_stage, to_stage, created_at")
    .eq("store_id", storeId)
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  return {
    lead: toLeadRow(lead),
    events: (events ?? []).map((event) => ({
      id: event.id,
      fromStage: event.from_stage,
      toStage: event.to_stage,
      createdAt: event.created_at,
    })),
  };
}

/** Só os em andamento com retorno marcado (cartões do Dashboard). */
export async function listFollowups(storeId: string): Promise<Pick<LeadRow, "id" | "name" | "nextFollowup" | "stage">[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("leads")
    .select("id, name, next_followup, stage")
    .eq("store_id", storeId)
    .eq("status", "active")
    .in("stage", ["new", "talking", "quoted"])
    .not("next_followup", "is", null)
    .order("next_followup", { ascending: true })
    .limit(200);
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, nextFollowup: row.next_followup, stage: row.stage }));
}
