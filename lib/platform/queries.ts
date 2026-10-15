import { createServerSupabaseClient } from "@/lib/supabase/server";

// Leitura só funciona para quem passa em is_platform_admin() (RLS,
// migration 0030) — stores_platform_admin_read / store_subscriptions_platform_admin_read.
export async function listStoresForPlatformAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("stores")
    .select("id, slug, name, status, created_at, store_subscriptions(status, billing_type, current_period_end, trial_ends_at)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    subscription: Array.isArray(row.store_subscriptions)
      ? (row.store_subscriptions[0] ?? null)
      : row.store_subscriptions,
  }));
}

export async function getStoreForPlatformAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("stores")
    .select(
      "id, slug, name, status, owner_user_id, whatsapp_number, created_at, store_subscriptions(status, billing_type, stripe_customer_id, stripe_subscription_id, current_period_end, trial_ends_at)",
    )
    .eq("id", storeId)
    .maybeSingle();

  if (!data) return null;

  // Dados do dono: nome/CPF vêm de profiles (policy profile_select_platform_admin);
  // o e-mail está em auth.users, só acessível pela RPC restrita a platform admin.
  const [{ data: owner }, { data: ownerEmail }] = await Promise.all([
    supabase.from("profiles").select("full_name, cpf").eq("id", data.owner_user_id).maybeSingle(),
    supabase.rpc("platform_admin_store_owner_email", { p_store_id: storeId }),
  ]);

  const { store_subscriptions, ...store } = data;
  return {
    ...store,
    owner: {
      name: owner?.full_name ?? null,
      cpf: owner?.cpf ?? null,
      email: (ownerEmail as string | null) ?? null,
    },
    subscription: Array.isArray(store_subscriptions) ? (store_subscriptions[0] ?? null) : store_subscriptions,
  };
}
