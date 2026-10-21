// Valores de ambiente do Stripe, LIMPOS. Ao colar uma chave/ID no painel do Vercel é
// comum entrar junto um Enter ou espaço no fim; esse caractere invisível já fez o
// Stripe recusar a requisição ("URL path includes forbidden characters") e derrubou
// o Checkout. Tirar o espaço aqui evita que um deslize de colagem vire erro em
// produção, e a validação de formato dá um motivo claro no log quando o valor
// está realmente errado.

// IDs de preço do Stripe: "price_" + letras/números.
const PRICE_ID_PATTERN = /^price_[A-Za-z0-9_]+$/;

export function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

// null = ausente ou com formato inválido (o chamador decide como avisar).
export function getStripePriceId(): string | null {
  const id = cleanEnv(process.env.STRIPE_PRICE_ID);
  return PRICE_ID_PATTERN.test(id) ? id : null;
}
