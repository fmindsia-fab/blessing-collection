import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import type { SubscriptionStatus } from "@/types/database.types";
import { createWebhookSupabaseClient } from "./service-role-client";

// Único consumidor de STRIPE_WEBHOOK_SECRET e único escritor em
// store_subscriptions (ver migration 0029 — RLS não permite insert/update
// de anon/authenticated). Trata eventos de assinatura como transições de
// estado (ver skill stripe-integration): cada handler sobrescreve o status
// inteiro a partir do payload do Stripe, nunca incrementa/decrementa nada.

type RelevantEvent =
  | "checkout.session.completed"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_failed";

const RELEVANT_EVENTS = new Set<RelevantEvent>([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  // Body cru (texto), nunca request.json() — a verificação de assinatura
  // exige os bytes exatos enviados pelo Stripe, antes de qualquer parsing.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[stripe-webhook] assinatura inválida", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type as RelevantEvent)) {
    return NextResponse.json({ received: true });
  }

  const supabase = createWebhookSupabaseClient();

  try {
    switch (event.type as RelevantEvent) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(supabase, subscription);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(supabase, subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as { subscription?: string | Stripe.Subscription | null })
          .subscription;
        if (!subscriptionId) break;

        const id = typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;
        const subscription = await stripe.subscriptions.retrieve(id);
        await syncSubscription(supabase, subscription);
        break;
      }
    }
  } catch (err) {
    console.error(`[stripe-webhook] falha processando ${event.type}`, err);
    // 500 faz o Stripe reentregar o evento (retry automático com backoff) —
    // melhor que engolir o erro e drifting silenciosamente do estado real.
    return NextResponse.json({ error: "Falha ao processar evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// store_subscriptions.status cobre os estados comerciais que a regra de
// acesso (store_has_access) distingue. O Stripe tem mais alguns (incomplete*,
// unpaid, paused) — mapeados para o mais próximo semanticamente, nunca
// descartados em silêncio.
function toStoreSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "incomplete_expired":
      return "expired";
    case "paused":
      return "canceled";
    default:
      return "past_due";
  }
}

async function syncSubscription(
  supabase: ReturnType<typeof createWebhookSupabaseClient>,
  subscription: Stripe.Subscription,
) {
  const storeId = subscription.metadata?.store_id;
  if (!storeId) {
    console.error("[stripe-webhook] subscription sem store_id em metadata", subscription.id);
    return;
  }

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
  const status = toStoreSubscriptionStatus(subscription.status);

  // Atualiza a MESMA linha criada pelo trigger de trial (onConflict store_id):
  // nunca cria uma segunda assinatura para a loja. stores.status NÃO é tocado
  // aqui — status da loja (administrativo) e da assinatura (comercial) são
  // conceitos separados; o acesso do catálogo vem de store_has_access().
  const trialEnd = subscription.trial_end;
  await supabase.from("store_subscriptions").upsert(
    {
      store_id: storeId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status,
      billing_type: "stripe",
      price_id: priceId,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      ...(trialEnd ? { trial_ends_at: new Date(trialEnd * 1000).toISOString() } : {}),
    },
    { onConflict: "store_id" },
  );
}
