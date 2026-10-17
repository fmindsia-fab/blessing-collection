import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import { resolveTenantFromHost } from "@/lib/store/resolve-tenant-from-host";

// No apex/www da plataforma não existe "a loja ativa": /admin ali dá 404. Quem
// já está logado é levado ao destino certo — painel da plataforma (se admin)
// ou o /admin do subdomínio da própria loja; sem loja ainda, ao cadastro.
async function resolveApexHome(
  request: NextRequest,
  supabase: ReturnType<typeof createMiddlewareSupabaseClient>["supabase"],
  userId: string,
): Promise<URL> {
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (isAdmin) return new URL("/admin-plataforma", request.url);

  const { data: store } = await supabase
    .from("stores")
    .select("slug")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Dono de loja: /auth/handoff gera o login de uso único e leva ao painel da
  // loja já autenticado (a sessão é por host, ver lib/auth/handoff.ts).
  if (store && process.env.PLATFORM_DOMAIN) {
    return new URL("/auth/handoff", request.url);
  }
  return new URL("/cadastro", request.url);
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  // "/admin-plataforma" também começa com "/admin" — checar primeiro e
  // excluir do resto da lógica de /admin (loja), senão o redirect pós-login
  // abaixo mandaria um platform admin de volta para o admin de uma loja.
  const isPlatformAdminRoute = pathname.startsWith("/admin-plataforma");
  const isAdminRoute = !isPlatformAdminRoute && pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login";

  // O painel da plataforma só existe no apex (ex. atelifacil.com.br). A sessão
  // é por host, então abrir /admin-plataforma num subdomínio de loja nunca
  // acharia a sessão do administrador — leva para o apex em vez de prender
  // a pessoa no /login do subdomínio.
  if (isPlatformAdminRoute && process.env.TENANT_RESOLUTION_MODE === "host") {
    const platformDomain = process.env.PLATFORM_DOMAIN;
    const tenant = resolveTenantFromHost(request.headers.get("host"));
    if (platformDomain && tenant.kind !== "none") {
      return NextResponse.redirect(
        new URL(`${pathname}${request.nextUrl.search}`, `https://${platformDomain}`),
      );
    }
  }

  if (isPlatformAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    const { data: isAdmin } = await supabase.rpc("is_platform_admin");
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  const isApexHost =
    process.env.TENANT_RESOLUTION_MODE === "host" &&
    resolveTenantFromHost(request.headers.get("host")).kind === "none";

  if (user && isApexHost && (isLoginRoute || isAdminRoute)) {
    return NextResponse.redirect(await resolveApexHome(request, supabase, user.id));
  }

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (process.env.TENANT_RESOLUTION_MODE === "host") {
    const tenant = resolveTenantFromHost(request.headers.get("host"));

    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-tenant-slug");
    requestHeaders.delete("x-tenant-domain");
    requestHeaders.delete("x-tenant-none");
    if (tenant.kind === "tenant") {
      requestHeaders.set("x-tenant-slug", tenant.slug);
    } else if (tenant.kind === "tenant-domain") {
      requestHeaders.set("x-tenant-domain", tenant.domain);
    } else {
      requestHeaders.set("x-tenant-none", "1");
    }

    // Repropaga os headers de tenant para o Server Component mantendo os
    // cookies de sessão que createMiddlewareSupabaseClient já definiu em
    // `response` (necessário para o auth.getUser() acima não perder a sessão).
    const tenantResponse = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.getAll().forEach((cookie) => tenantResponse.cookies.set(cookie));
    return tenantResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
