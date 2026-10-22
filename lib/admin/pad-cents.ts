// Completa os centavos de um campo numérico ao sair dele: 10 vira 10.00 (o navegador
// mostra 10,00 em pt-BR). Campo vazio continua vazio.
export function padCents(input: HTMLInputElement) {
  if (input.value === "") return;
  const value = Number(input.value);
  if (Number.isFinite(value) && value >= 0) input.value = value.toFixed(2);
}
