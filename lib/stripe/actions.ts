"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { getActiveStore, getSiteUrl } from "@/lib/store/get-active-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Cria (ou reaproveita) o stripe_customer_id da loja antes de abrir o
// Checkout — Stripe recomenda ter sempre um Customer por trás de uma
// assinatura, em vez de deixar o Checkout criar um novo a cada sessão.
async function ensureStripeCustomerId(storeId: string, storeName: string, ownerEmail: string | null) {
  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("store_subscriptions")
    .select("stripe_customer_id")
    .eq("store_id", storeId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    name: storeName,
    email: ownerEmail ?? undefined,
    metadata: { store_id: storeId },
  });

  return customer.id;
}

// Inicia uma assinatura paga para a loja ativa. O registro em
// store_subscriptions só é criado/atualizado de verdade pelo webhook
// (checkout.session.completed) — esta action nunca escreve no banco
// diretamente, só prepara o Customer e redireciona pro Checkout.
export async function startCheckout() {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await ensureStripeCustomerId(store.id, store.name, user?.email ?? null);

  const siteUrl = await getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    // store_id chega no webhook via subscription.metadata, não só no
    // customer — subscription.updated/deleted não reenvia o customer inteiro.
    subscription_data: { metadata: { store_id: store.id } },
    success_url: `${siteUrl}/admin/configuracoes?checkout=sucesso`,
    cancel_url: `${siteUrl}/admin/configuracoes?checkout=cancelado`,
  });

  if (!session.url) throw new Error("Stripe não retornou uma URL de checkout.");
  redirect(session.url);
}

// Portal de billing self-service (Stripe Customer Portal) — upgrade, troca
// de cartão e cancelamento são geridos inteiramente pelo Stripe, sem UI
// própria. Exige que a loja já tenha um stripe_customer_id (ou seja, já
// passou pelo menos uma vez pelo Checkout).
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
  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${siteUrl}/admin/configuracoes`,
  });

  redirect(session.url);
}
