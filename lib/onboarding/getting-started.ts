import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAnalyticsTotals } from "@/lib/analytics/queries";
import { getProductCoverUrls } from "@/lib/products/admin-queries";

export type GettingStartedItem = {
  key: string;
  title: string;
  hint: string;
  href: string;
  done: boolean;
};

// Lista "Comece por aqui" do Dashboard. Cada item é marcado só com dados que já existem
// (peças, fotos, logo, pedidos, visitas): nada de evento novo nem de "marcar como feito".
// Quando tudo estiver pronto, o cartão some sozinho.
export async function getGettingStarted(
  store: { id: string; logo_url: string | null },
  productIds: string[],
): Promise<GettingStartedItem[]> {
  const supabase = await createServerSupabaseClient();

  const [covers, ordersResult, totals] = await Promise.all([
    getProductCoverUrls(productIds),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", store.id),
    getAnalyticsTotals(store.id, "total"),
  ]);

  return [
    {
      key: "product",
      title: "Cadastre sua primeira peça",
      hint: "Nome, preço e uma descrição curta.",
      href: "/admin/produtos/novo",
      done: productIds.length > 0,
    },
    {
      key: "photos",
      title: "Coloque fotos nas suas peças",
      hint: "Boas fotos fazem a cliente querer a peça.",
      href: "/admin/produtos",
      done: Object.keys(covers).length > 0,
    },
    {
      key: "logo",
      title: "Coloque o logo da sua loja",
      hint: "Ele aparece no topo do seu catálogo.",
      href: "/admin/configuracoes",
      done: Boolean(store.logo_url),
    },
    {
      key: "share",
      title: "Compartilhe o link da sua loja",
      hint: "Mande no WhatsApp e no Instagram. Este item marca quando alguém abrir uma peça.",
      href: "/admin/configuracoes",
      done: totals.productViews > 0,
    },
    {
      key: "order",
      title: "Registre seu primeiro pedido",
      hint: "Acompanhe as encomendas: orçamento, produção e entrega.",
      href: "/admin/pedidos/novo",
      done: (ordersResult.count ?? 0) > 0,
    },
  ];
}
