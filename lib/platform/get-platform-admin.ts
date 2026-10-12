import { createServerSupabaseClient } from "@/lib/supabase/server";

// Único ponto do projeto que decide "esta sessão é de um admin da
// plataforma". Usa a RPC is_platform_admin() (security definer, migration
// 0030) em vez de um select direto em profiles — evita qualquer dúvida
// sobre recursão de RLS e mantém a checagem num único lugar auditável.
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.rpc("is_platform_admin");
  return data ?? false;
}
