/**
 * Ícones de marca em traço fino, para combinar com o editorial.
 * Desenhados aqui porque o lucide-react não distribui logos de marca
 * (Instagram, WhatsApp) por questão de propriedade das marcas.
 */

type IconProps = { className?: string };

export function WhatsappGlyph({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3.5 20.5l1.3-4.2A8.2 8.2 0 1 1 8 19.3l-4.5 1.2z" />
      <path d="M9 9.2c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.3 0 .5-.1.7l-.4.5c-.1.2-.2.3 0 .6a6.3 6.3 0 0 0 2.8 2.4c.3.1.4 0 .6-.1l.5-.6c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .5-.3 1.4-1.4 1.6-1 .2-2.3 0-4.4-1.3-2-1.3-3-3-3.2-3.9-.2-.9 0-1.9.5-2.4z" />
    </svg>
  );
}

export function InstagramGlyph({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
