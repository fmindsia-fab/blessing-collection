import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import { resolveTenantFromHost } from "@/lib/store/resolve-tenant-from-host";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === "/login";

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
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
