import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/store/get-active-store";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Painel e login não têm valor de busca e não devem aparecer em
      // resultados. Não é controle de acesso — isso é a RLS; é só higiene
      // de indexação. /sacola depende do localStorage do visitante, então
      // indexá-la traria uma página sempre vazia.
      disallow: ["/admin", "/admin/", "/login", "/sacola", "/selecao"],
    },
    sitemap: siteUrl ? `${siteUrl.replace(/\/+$/, "")}/sitemap.xml` : undefined,
  };
}
