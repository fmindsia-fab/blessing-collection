import { ActionLink } from "@/components/ui/action";

type SectionHeadingProps = {
  kicker?: string;
  title: string;
  href?: string;
  linkLabel?: string;
};

// Cabeçalho de seção centralizado, com fio de acento sob o título.
export function SectionHeading({ kicker, title, href, linkLabel }: SectionHeadingProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {kicker ? <span className="kicker">{kicker}</span> : null}
      <h2 className="font-[family-name:var(--font-brand)] text-[1.75rem] leading-none tracking-tight sm:text-3xl">
        {title}
      </h2>
      <span aria-hidden className="h-px w-12 rounded-full bg-[var(--gold)]" />

      {href ? (
        <ActionLink href={href} variant="ghost" arrow className="mt-1">
          {linkLabel ?? "Ver tudo"}
        </ActionLink>
      ) : null}
    </div>
  );
}
