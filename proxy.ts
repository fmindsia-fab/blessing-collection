import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import { resolveTenantFromHost } from "@/lib/store/resolve-tenant-from-host";

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
      url.pathname = "/cadastro";
      return NextResponse.redirect(url);
    }
  }

  // Apex/www da plataforma ainda não tem landing page própria — "/" caindo
  // em app/(public)/page.tsx (que espera uma loja ativa) resultaria em 404.
  // Redireciona para a única página de marketing que existe hoje.
  if (
    pathname === "/" &&
    process.env.TENANT_RESOLUTION_MODE === "host" &&
    resolveTenantFromHost(request.headers.get("host")).kind === "none"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/cadastro";
    return NextResponse.redirect(url);
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
