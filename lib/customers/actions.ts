"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";

export type CustomerFormState = {
  error?: string;
  success?: boolean;
};

const customerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da cliente").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("customers").insert({
    store_id: store.id,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: "Não foi possível cadastrar a cliente." };

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function updateCustomer(
  id: string,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return { error: "Não foi possível salvar a cliente." };

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/pedidos");
  return { success: true };
}

// "Excluir" no painel é sempre soft delete via status (regra do CLAUDE.md).
export async function toggleCustomer(id: string, currentStatus: string) {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  await supabase
    .from("customers")
    .update({ status: currentStatus === "active" ? "archived" : "active" })
    .eq("id", id)
    .eq("store_id", store.id);

  revalidatePath("/admin/clientes");
}
