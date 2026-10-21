import "server-only";
import { stripe } from "@/lib/stripe/client";
import { getStripePriceId } from "@/lib/stripe/env";

// Rótulo do plano ("R$ 59,90/mês") lido direto do Preço no Stripe: o valor mora
// SÓ lá. Para mudar o preço do plano, cria-se um novo Preço no Stripe (preços são
// imutáveis) e troca-se STRIPE_PRICE_ID — nada no código.
//
// Qualquer falha (chave ausente, preço removido, Stripe fora do ar) devolve null
// e a tela simplesmente não mostra o valor, sem derrubar as Configurações.
const INTERVAL_LABEL: Record<string, string> = {
  day: "dia",
  week: "semana",
  month: "mês",
  year: "ano",
};

export async function getPlanPriceLabel(): Promise<string | null> {
  const priceId = getStripePriceId();
  if (!priceId) return null;

  try {
    const price = await stripe.prices.retrieve(priceId);
    if (price.unit_amount === null || !price.recurring) return null;

    const amount = (price.unit_amount / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: price.currency.toUpperCase(),
    });
    const { interval, interval_count: count } = price.recurring;
    const unit = INTERVAL_LABEL[interval] ?? interval;

    return count > 1 ? `${amount} a cada ${count} ${unit}s` : `${amount}/${unit}`;
  } catch (error) {
    console.error("[getPlanPriceLabel]", error instanceof Error ? error.message : error);
    return null;
  }
}
