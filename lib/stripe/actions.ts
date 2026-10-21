"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { getActiveStore, getSiteUrl } from "@/lib/store/get-active-store";
import { getNotOwnerError } from "@/lib/store/ownership";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { computeCheckoutTrialEnd } from "@/lib/stripe/trial";
import { describeStripeError } from "@/lib/stripe/errors";
import { getStripePriceId } from "@/lib/stripe/env";

// Inicia uma assinatura paga para a loja ativa. O registro em
// store_subscriptions só é criado/atualizado de verdade pelo webhook
// (checkout.session.completed) — esta action nunca escreve no banco
// diretamente, só monta a sessão e redireciona pro Checkout.
//
// Cliente (Customer) no Stripe: reaproveita o que o webhook já gravou (quem
// cancelou e volta a assinar mantém o histórico e as faturas). Na primeira
// assinatura NÃO criamos o Customer antes: o Checkout em modo assinatura cria
// um sozinho ao concluir. Pré-criar deixava Customers órfãos a cada Checkout
// aberto e abandonado.
export async function startCheckout() {
  const store = await getActiveStore();

  // Conta que não é a dona da loja não deve abrir cobrança em nome dela.
  if (await getNotOwnerError(store)) {
    redirect("/admin/configuracoes?checkout=outra-conta");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subscription } = await supabase
    .from("store_subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, status, trial_ends_at")
    .eq("store_id", store.id)
    .maybeSingle();

  // Já existe uma assinatura VIVA no Stripe (ativa, em teste ou com pagamento em
  // atraso): criar outra cobraria em dobro. O caminho certo é o portal (atualizar
  // cartão, desfazer cancelamento). Cobre botão antigo em aba aberta e duplo clique.
  if (
    subscription?.stripe_subscription_id &&
    subscription.stripe_customer_id &&
    ["active", "past_due", "trialing"].includes(subscription.status)
  ) {
    await openBillingPortal();
  }

  // Dias que sobram do teste grátis próprio são preservados: cobra só no fim.
  const trialEnd = computeCheckoutTrialEnd(subscription ?? null, new Date());

  const siteUrl = await getSiteUrl();

  // ID do preço limpo e validado: ausente ou malformado vira aviso na tela + motivo
  // claro no log, em vez de uma tela de erro do servidor.
  const priceId = getStripePriceId();
  if (!priceId) {
    console.error("[startCheckout] STRIPE_PRICE_ID ausente ou com formato inválido (esperado: price_...)");
    redirect("/admin/configuracoes?checkout=erro");
  }

  // redirect() lança uma exceção de controle do Next: precisa ficar FORA do try,
  // senão o catch a engole e o cliente nunca chega ao Checkout.
  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(subscription?.stripe_customer_id
        ? { customer: subscription.stripe_customer_id }
        : { customer_email: user?.email ?? undefined }),
      client_reference_id: store.id,
      locale: "pt-BR",
      // Sem payment_method_types: os meios de pagamento vêm das configurações do
      // Dashboard (métodos dinâmicos).
      line_items: [{ price: priceId, quantity: 1 }],
      // store_id chega no webhook via subscription.metadata, não só no
      // customer — subscription.updated/deleted não reenvia o customer inteiro.
      subscription_data: {
        metadata: { store_id: store.id },
        ...(trialEnd ? { trial_end: trialEnd } : {}),
      },
      success_url: `${siteUrl}/admin/configuracoes?checkout=sucesso`,
      cancel_url: `${siteUrl}/admin/configuracoes?checkout=cancelado`,
    });
    checkoutUrl = session.url;
  } catch (error) {
    console.error("[startCheckout] falha ao criar a sessão de pagamento", {
      storeId: store.id,
      ...describeStripeError(error),
    });
  }

  if (!checkoutUrl) redirect("/admin/configuracoes?checkout=erro");
  redirect(checkoutUrl);
}

// Portal de billing self-service (Stripe Customer Portal) — troca de cartão,
// faturas e cancelamento são geridos inteiramente pelo Stripe, sem UI própria.
// Exige que a loja já tenha um stripe_customer_id (ou seja, já passou pelo
// menos uma vez pelo Checkout).
export async function openBillingPortal() {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("store_subscriptions")
    .select("stripe_customer_id")
    .eq("store_id", store.id)
    .maybeSingle();

  if (!data?.stripe_customer_id) {
    throw new Error("Esta loja ainda não tem uma assinatura para gerenciar.");
  }

  const siteUrl = await getSiteUrl();

  let portalUrl: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${siteUrl}/admin/configuracoes`,
    });
    portalUrl = session.url;
  } catch (error) {
    console.error("[openBillingPortal] falha ao abrir o portal", {
      storeId: store.id,
      ...describeStripeError(error),
    });
  }

  if (!portalUrl) redirect("/admin/configuracoes?checkout=erro");
  redirect(portalUrl);
}
