import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  status: "active" | "archived";
};

// Só ativos — uso no seletor de pedido novo, para não reaproveitar cliente
// arquivado sem querer.
export async function listActiveCustomers(storeId: string): Promise<CustomerRow[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, notes, status")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("name", { ascending: true });

  return data ?? [];
}

export async function listAllCustomersForAdmin(storeId: string): Promise<CustomerRow[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, notes, status")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getCustomer(storeId: string, id: string): Promise<CustomerRow | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, notes, status")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  return data;
}

/** Histórico de pedidos de um cliente, mais recente primeiro. */
export async function listCustomerOrders(storeId: string, customerId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("orders")
    .select("id, status, order_date, expected_delivery_date, total_amount")
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .order("order_date", { ascending: false });

  return data ?? [];
}
