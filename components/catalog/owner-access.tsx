"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const REQUIRED_CLICKS = 5;
// Cliques espaçados demais não contam: evita acumular toques acidentais ao
// longo da sessão e disparar o acesso sem intenção.
const RESET_AFTER_MS = 1500;

/**
 * Acesso discreto ao painel: o fio decorativo sob o nome da loja leva a
 * /login após 5 cliques seguidos.
 *
 * Isto é aparência, não segurança — a URL /login continua pública e
 * adivinhável. A proteção real é a RLS em toda query, mais o redirect do
 * proxy.ts. O gesto só evita anunciar o painel a quem recebe o catálogo
 * compartilhado.
 */
export function OwnerAccess() {
  const router = useRouter();
  const count = useRef(0);
  const lastClick = useRef(0);
  const [almost, setAlmost] = useState(false);

  function handleClick() {
    const now = Date.now();
    count.current = now - lastClick.current > RESET_AFTER_MS ? 1 : count.current + 1;
    lastClick.current = now;

    // Feedback mínimo a partir do 3º clique: confirma para a proprietária que
    // o gesto está sendo reconhecido, sem revelar nada a quem clicou por acaso.
    setAlmost(count.current >= 3);

    if (count.current >= REQUIRED_CLICKS) {
      count.current = 0;
      setAlmost(false);
      router.push("/login");
    }
  }

  // O fio tem 1px de altura: clicável só por acidente, tanto no desktop
  // quanto no toque. O wrapper dá uma área de alvo real (~24px) sem mudar
  // o que se vê.
  return (
    <span
      onClick={handleClick}
      aria-hidden="true"
      className="flex h-6 cursor-default items-center justify-center px-4"
    >
      <span
        className={`block h-px rounded-full bg-[var(--gold)] transition-all duration-300 ${
          almost ? "w-16" : "w-12"
        }`}
      />
    </span>
  );
}
