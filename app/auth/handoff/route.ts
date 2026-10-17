import { NextResponse, type NextRequest } from "next/server";
import { buildStoreHandoff } from "@/lib/auth/handoff";

// Leva quem está logado no domínio principal para o painel da PRÓPRIA loja,
// já autenticado lá (ver lib/auth/handoff.ts). Sem parâmetros: nada vem da
// requisição, então não há como apontar o repasse para outra loja ou site.
export async function GET(request: NextRequest) {
  const result = await buildStoreHandoff();

  switch (result.kind) {
    case "ok":
      return NextResponse.redirect(result.url);
    case "no-session":
      return NextResponse.redirect(new URL("/login", request.url));
    case "no-store":
      return NextResponse.redirect(new URL("/cadastro/loja", request.url));
    case "unavailable":
      // Sem repasse possível: cai no login do subdomínio (ou no cadastro).
      return NextResponse.redirect(result.fallbackUrl ?? new URL("/cadastro", request.url));
  }
}
