import "server-only";
import Stripe from "stripe";
import { cleanEnv } from "@/lib/stripe/env";

// Único ponto de instanciação do SDK Stripe — nunca importar "stripe" nem
// ler STRIPE_SECRET_KEY fora daqui. "server-only" quebra o build se este
// módulo for importado por engano de um Client Component.
export const stripe = new Stripe(cleanEnv(process.env.STRIPE_SECRET_KEY), {
  apiVersion: "2026-09-30.endive",
});
