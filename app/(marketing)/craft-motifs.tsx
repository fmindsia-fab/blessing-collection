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

// Novelo de lã com fio solto saindo — o fio balança suavemente via a
// classe utilitária `animate-yarn-sway` (ver globals.css).
export function YarnBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" fill="none" className={className} aria-hidden>
      <circle cx="60" cy="55" r="42" fill="currentColor" opacity="0.12" />
      <circle cx="60" cy="55" r="42" stroke="currentColor" strokeWidth="2" />
      <path
        d="M22 40c24 14 52 14 76 0M20 55h80M22 70c24-14 52-14 76 0M35 24c10 20 10 42 0 62M85 24c-10 20-10 42 0 62"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M84 82c4 10 2 20-6 28s-10 14-6 20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="origin-[84px_82px] animate-yarn-sway"
      />
      <circle cx="72" cy="130" r="3" fill="currentColor" className="origin-[84px_82px] animate-yarn-sway" />
    </svg>
  );
}

// Par de agulhas de crochê cruzadas, com um laço de fio entre as pontas.
export function CrochetHooks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <g strokeLinecap="round">
        <path d="M14 106 98 22" stroke="currentColor" strokeWidth="3.5" />
        <path d="M98 22c3-3 7-3 10 0s3 7 0 10l-6 6-10-10 6-6Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M106 14 98 22" stroke="currentColor" strokeWidth="2.5" />
        <path d="M106 98 22 14" stroke="currentColor" strokeWidth="3.5" opacity="0.55" />
        <path
          d="M22 14c-3-3-7-3-10 0s-3 7 0 10l6 6 10-10-6-6Z"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          opacity="0.55"
        />
      </g>
      <path
        d="M30 90c14 10 30 10 44-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
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
