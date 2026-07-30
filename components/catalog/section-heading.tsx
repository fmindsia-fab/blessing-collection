import Link from "next/link";

type SectionHeadingProps = {
  kicker?: string;
  title: string;
  href?: string;
  linkLabel?: string;
};

// Cabeçalho editorial: rótulo em versalete, título serifado e fio dourado.
export function SectionHeading({ kicker, title, href, linkLabel }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="rule-heading flex flex-col gap-1.5">
        {kicker ? <span className="kicker">{kicker}</span> : null}
        <h2 className="font-[family-name:var(--font-brand)] text-2xl leading-none tracking-tight sm:text-[1.75rem]">
          {title}
        </h2>
      </div>

      {href ? (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-2 pb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          {linkLabel ?? "Ver tudo"}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      ) : null}
    </div>
  );
}
