"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getNotOwnerError } from "@/lib/store/ownership";
import { phoneDigits } from "./calc";
import { leadSchema, stageSchema } from "./schema";

export type LeadFormState = { error?: string; success?: boolean };

function revalidateLeads() {
  revalidatePath("/admin/funil");
  revalidatePath("/admin");
}

function friendlyDbError(error: { code?: string; message: string }, fallback: string): string {
  if (error.code === "P0001") return error.message;
  console.error("[funil]", error.code, error.message);
  return fallback;
}

/** Cliente escolhida no formulário: só vale se for desta loja; qualquer outro valor vira "sem cliente". */
async function resolveCustomerId(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  storeId: string,
  formData: FormData,
): Promise<string | null> {
  const value = String(formData.get("customerId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return null;
  const { data } = await supabase.from("customers").select("id").eq("id", value).eq("store_id", storeId).maybeSingle();
  return data?.id ?? null;
}

function parseLeadForm(formData: FormData) {
  return leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    interest: formData.get("interest"),
    estimatedValue: formData.get("estimatedValue"),
    nextFollowup: formData.get("nextFollowup"),
    notes: formData.get("notes"),
  });
}

export async function createLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const parsed = parseLeadForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      store_id: store.id,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      source: parsed.data.source,
      interest: parsed.data.interest ?? null,
      estimated_value: parsed.data.estimatedValue,
      next_followup: parsed.data.nextFollowup ?? null,
      notes: parsed.data.notes ?? null,
      customer_id: await resolveCustomerId(supabase, store.id, formData),
    })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyDbError(error ?? { message: "sem retorno" }, "Não foi possível salvar o contato. Tente novamente.") };

  revalidateLeads();
  redirect("/admin/funil");
}

export async function updateLead(leadId: string, _prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const parsed = parseLeadForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("leads")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      source: parsed.data.source,
      interest: parsed.data.interest ?? null,
      estimated_value: parsed.data.estimatedValue,
      next_followup: parsed.data.nextFollowup ?? null,
      notes: parsed.data.notes ?? null,
      customer_id: await resolveCustomerId(supabase, store.id, formData),
    })
    .eq("id", leadId)
    .eq("store_id", store.id)
    .eq("status", "active");
  if (error) return { error: friendlyDbError(error, "Não foi possível salvar o contato. Tente novamente.") };

  revalidateLeads();
  revalidatePath(`/admin/funil/${leadId}`);
  return { success: true };
}

/** Muda a etapa. "Perdido" aceita um motivo; as demais etapas limpam o motivo (trigger do banco). */
export async function setLeadStage(leadId: string, stage: string, lostReason?: string): Promise<LeadFormState> {
  const parsed = stageSchema.safeParse({ stage, lostReason });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("leads")
    .update({ stage: parsed.data.stage, lost_reason: parsed.data.stage === "lost" ? (parsed.data.lostReason ?? null) : null })
    .eq("id", leadId)
    .eq("store_id", store.id)
    .eq("status", "active");
  if (error) return { error: friendlyDbError(error, "Não foi possível mudar a etapa. Tente novamente.") };

  revalidateLeads();
  revalidatePath(`/admin/funil/${leadId}`);
  return { success: true };
}

// "Excluir" não apaga: o contato fica arquivado e sai do quadro.
export async function archiveLead(leadId: string): Promise<LeadFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("leads")
    .update({ status: "archived" })
    .eq("id", leadId)
    .eq("store_id", store.id);
  if (error) return { error: friendlyDbError(error, "Não foi possível remover o contato. Tente novamente.") };

  revalidateLeads();
  redirect("/admin/funil");
}

/**
 * "Virar pedido": usa a cliente de mesmo telefone (ou cria uma nova com os dados do contato), liga ao
 * contato e abre o formulário de novo pedido já com a cliente escolhida. O contato só vira "Fechado"
 * quando o pedido é de fato criado (createOrder).
 */
export async function startOrderFromLead(leadId: string): Promise<LeadFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, phone, interest, notes, customer_id, order_id")
    .eq("id", leadId)
    .eq("store_id", store.id)
    .eq("status", "active")
    .maybeSingle();
  if (!lead) return { error: "Contato não encontrado." };
  if (lead.order_id) redirect(`/admin/pedidos/${lead.order_id}`);

  let customerId = lead.customer_id;

  if (customerId) {
    const { data: stillThere } = await supabase.from("customers").select("id").eq("id", customerId).eq("store_id", store.id).maybeSingle();
    if (!stillThere) customerId = null;
  }

  if (!customerId) {
    const digits = phoneDigits(lead.phone);
    if (digits.length >= 8) {
      const { data: customers } = await supabase.from("customers").select("id, phone").eq("store_id", store.id).not("phone", "is", null).limit(2000);
      customerId = customers?.find((customer) => phoneDigits(customer.phone) === digits)?.id ?? null;
    }
  }

  if (!customerId) {
    const { data: created, error } = await supabase
      .from("customers")
      .insert({
        store_id: store.id,
        name: lead.name,
        phone: lead.phone,
        notes: lead.interest ? `Interesse: ${lead.interest}` : null,
      })
      .select("id")
      .single();
    if (error || !created) return { error: friendlyDbError(error ?? { message: "sem retorno" }, "Não foi possível cadastrar a cliente. Tente novamente.") };
    customerId = created.id;
    revalidatePath("/admin/clientes");
  }

  await supabase.from("leads").update({ customer_id: customerId }).eq("id", lead.id).eq("store_id", store.id);

  redirect(`/admin/pedidos/novo?cliente=${customerId}&contato=${lead.id}`);
}
