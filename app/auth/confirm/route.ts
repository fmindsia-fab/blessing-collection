import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";

// Destino dos links enviados por e-mail (confirmação de cadastro e
// recuperação de senha). O modelo do e-mail aponta para cá com `token_hash` e
// `type`; validamos o token no servidor, o que grava a sessão nos cookies
// DESTE host, e então seguimos para `next`.
//
// Só aceitamos os tipos que o produto usa — qualquer outro (convite, troca de
// e-mail, magic link) não faz parte do MVP e é recusado.
const ALLOWED_TYPES = new Set<EmailOtpType>(["email", "signup", "recovery"]);

const ERROR_DESTINATION: Partial<Record<EmailOtpType, string>> = {
  recovery: "/esqueci-senha?erro=link-invalido",
  email: "/cadastro?erro=link-invalido",
  signup: "/cadastro?erro=link-invalido",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), "/");

  if (!tokenHash || !type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.redirect(new URL("/login?erro=link-invalido", request.url));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Link expirado, já usado ou adulterado.
    return NextResponse.redirect(new URL(ERROR_DESTINATION[type] ?? "/login?erro=link-invalido", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
