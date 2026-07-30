import { ActionLink } from "@/components/ui/action";

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
        <ActionLink href={href} variant="ghost" arrow className="hidden shrink-0 pb-3 sm:inline-flex">
          {linkLabel ?? "Ver tudo"}
        </ActionLink>
      ) : null}
    </div>
  );
}
