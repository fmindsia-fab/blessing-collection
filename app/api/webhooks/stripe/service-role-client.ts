import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Único uso de SUPABASE_SERVICE_ROLE_KEY no projeto inteiro — escrita em
// store_subscriptions só é permitida por aqui porque a RLS da tabela não
// tem policy de insert/update para anon/authenticated (ver migration 0029).
// NUNCA reexportar este módulo nem importá-lo fora deste diretório de rota;
// "server-only" só impede uso em Client Components, não substitui essa regra.
export function createWebhookSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
