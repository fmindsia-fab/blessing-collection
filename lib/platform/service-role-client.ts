import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Usos de SUPABASE_SERVICE_ROLE_KEY no projeto (além do webhook do Stripe):
//  - ações do admin da plataforma (excluir contas, listar logins): só depois de
//    verificar isPlatformAdmin();
//  - registro do aceite dos Termos (lib/legal/acceptance.ts): a tabela
//    legal_acceptances não tem policy de escrita para usuários, de propósito.
// NUNCA expor em Client Component.
export function createPlatformServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
