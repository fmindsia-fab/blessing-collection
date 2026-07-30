export function PageHeading({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        {kicker ? (
          <span className="text-[0.625rem] uppercase tracking-[0.22em] text-muted-foreground">
            {kicker}
          </span>
        ) : null}
        <h1 className="font-[family-name:var(--font-brand)] text-[2rem] leading-none tracking-tight sm:text-[2.25rem]">
          {title}
        </h1>
        {/* Fio central curto: fecha o bloco sem puxar o olho para a esquerda. */}
        <span aria-hidden className="mt-1 h-px w-12 rounded-full bg-[var(--gold)]" />
        {description ? (
          <p className="max-w-prose pt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
