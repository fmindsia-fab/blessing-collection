import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StoreForm } from "../signup-form";

// Segunda etapa do cadastro para quem confirmou o e-mail: o link da mensagem
// passa por /auth/confirm (que grava a sessão) e termina aqui.
export default async function CreateStorePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/cadastro?erro=sessao");

  const platformDomain = process.env.PLATFORM_DOMAIN ?? "";

  // Um usuário por loja: quem já criou a sua vai direto para o painel dela.
  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing && platformDomain) redirect("/auth/handoff");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl leading-none tracking-tight">Crie sua loja</h1>
          <p className="text-sm text-muted-foreground">
            E-mail confirmado! Falta só contar sobre o seu ateliê.
          </p>
        </div>
        <StoreForm platformDomain={platformDomain} />
      </div>
    </main>
  );
}
