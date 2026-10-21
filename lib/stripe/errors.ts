// Resumo seguro de um erro do Stripe para o log do servidor. A mensagem do Stripe
// diz exatamente o que faltou (ex.: permissão da chave restrita, preço inativo,
// parâmetro inválido) e não contém a chave inteira. Sem isto, o erro virava só
// "A server error occurred" na tela, sem pista nenhuma nos logs.
export function describeStripeError(error: unknown) {
  if (error && typeof error === "object") {
    const e = error as {
      type?: string;
      code?: string;
      message?: string;
      statusCode?: number;
      requestId?: string;
      param?: string;
    };
    return {
      type: e.type,
      code: e.code,
      param: e.param,
      statusCode: e.statusCode,
      requestId: e.requestId,
      message: e.message,
    };
  }
  return { message: String(error) };
}
