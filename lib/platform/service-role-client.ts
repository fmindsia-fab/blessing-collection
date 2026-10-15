import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Segundo (e último) uso de SUPABASE_SERVICE_ROLE_KEY no projeto, além do
// webhook do Stripe: a exclusão definitiva de conta pelo admin da plataforma
// precisa apagar usuário do Auth e arquivos do Storage de outra pessoa, o que
// nenhuma RLS permite. Só importar a partir de server actions que já tenham
// verificado isPlatformAdmin(). NUNCA expor em Client Component.
export function createPlatformServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
