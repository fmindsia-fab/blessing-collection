import "server-only";
import { headers } from "next/headers";
import { createPlatformServiceClient } from "@/lib/platform/service-role-client";
import { normalizeUserAgent, parseClientIp } from "@/lib/legal/evidence";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/versions";

// Registro do aceite dos Termos e da Política. A gravação usa a service_role de
// propósito: a tabela legal_acceptances não tem policy de escrita para usuários
// (ninguém consegue forjar ou alterar um aceite pela API). Só chamar depois de a
// aplicação ter confirmado quem é o usuário e que ele de fato aceitou.

export type AcceptanceSource = "signup" | "store_creation";

export async function recordLegalAcceptance(userId: string, source: AcceptanceSource): Promise<{ ok: boolean }> {
  try {
    const headerList = await headers();

    const { error } = await createPlatformServiceClient()
      .from("legal_acceptances")
      .insert({
        user_id: userId,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        ip_address: parseClientIp(headerList.get("x-forwarded-for"), headerList.get("x-real-ip")),
        user_agent: normalizeUserAgent(headerList.get("user-agent")),
        source,
      });

    if (error) {
      console.error("[recordLegalAcceptance]", error.code, error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error("[recordLegalAcceptance]", error instanceof Error ? error.message : error);
    return { ok: false };
  }
}

// A pessoa já aceitou as versões VIGENTES? (usado ao criar a loja: quem criou a conta
// por fora da tela de cadastro, ou cujo registro falhou, precisa aceitar antes.)
export async function hasAcceptedCurrentLegal(userId: string): Promise<boolean> {
  const { data, error } = await createPlatformServiceClient()
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_version", TERMS_VERSION)
    .eq("privacy_version", PRIVACY_VERSION)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[hasAcceptedCurrentLegal]", error.code, error.message);
    return false;
  }
  return data !== null;
}
