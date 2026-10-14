// Elementos gráficos decorativos remetendo a artesanato (fio, tricô,
// crochê) — só a landing institucional usa isso (app/(marketing)), sem
// depender de fotografia externa. currentColor herda a cor do elemento pai
// via className, como qualquer ícone lucide-react do projeto.

export function YarnSkein({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <path
        d="M20 35c20 10 20 30 0 40M35 18c10 20 30 20 40 0M65 82c-10-20-30-20-40 0M82 65c-20-10-20-30 0-40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 28c14 22 30 22 44 0M28 72c14-22 30-22 44 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function StitchWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 40" fill="none" className={className} aria-hidden>
      <path
        d="M4 20c6-14 14-14 20 0s14 14 20 0 14-14 20 0 14 14 20 0 14-14 20 0 14 14 20 0 14-14 20 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CrochetDots({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 16" fill="none" className={className} aria-hidden>
      <circle cx="4" cy="8" r="3" fill="currentColor" />
      <circle cx="14" cy="8" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="24" cy="8" r="3" fill="currentColor" opacity="0.45" />
      <circle cx="34" cy="8" r="3" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

// Ilustração do passo 1 ("Crie sua loja") — uma etiqueta pendurada por um
// fio, remetendo às etiquetas de marca costuradas nas peças artesanais.
export function StoreTagIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" fill="none" className={className} aria-hidden>
      <path d="M80 8v24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <rect
        x="34"
        y="32"
        width="92"
        height="68"
        rx="14"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <circle cx="80" cy="24" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M58 58h44M58 72h44M58 86h26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M20 110c18 10 40 10 60 0s42-10 60 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

// Ilustração do passo 2 ("Monte seu catálogo") — grade de peças, como um
// mosaico de fotos de produto.
export function CatalogGridIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" fill="none" className={className} aria-hidden>
      <rect x="22" y="22" width="48" height="48" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <rect x="90" y="22" width="48" height="48" rx="10" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      <rect x="22" y="90" width="48" height="48" rx="10" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      <rect x="90" y="90" width="48" height="48" rx="10" stroke="currentColor" strokeWidth="2.5" opacity="0.45" />
      <circle cx="46" cy="46" r="8" fill="currentColor" opacity="0.35" />
      <path
        d="M98 54l10-14 10 14M98 54h22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

// Ilustração do passo 3 ("Venda pelo WhatsApp") — balão de mensagem com um
// coração, no mesmo traço orgânico dos outros motivos de fio.
export function WhatsappBubbleIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" fill="none" className={className} aria-hidden>
      <path
        d="M30 32h100a10 10 0 0 1 10 10v48a10 10 0 0 1-10 10H70l-24 18v-18H30a10 10 0 0 1-10-10V42a10 10 0 0 1 10-10Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M80 58c-4-6-13-6-16 1-2 5 2 10 16 22 14-12 18-17 16-22-3-7-12-7-16-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <path
        d="M20 100c-6 4-10 10-10 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function YarnTangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 140" fill="none" className={className} aria-hidden>
      <path
        d="M70 10c33 0 60 27 60 60s-27 60-60 60S10 103 10 70 37 10 70 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <path
        d="M25 50c20-18 45-18 60 0s35 18 55 0M20 90c22 16 46 16 60 0s40-16 60 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 25c12 24 12 48 0 72M100 25c-12 24-12 48 0 72"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
