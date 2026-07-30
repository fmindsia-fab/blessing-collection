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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="rule-heading flex flex-col gap-1.5">
        {kicker ? (
          <span className="text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">{kicker}</span>
        ) : null}
        <h1 className="font-[family-name:var(--font-brand)] text-[1.75rem] leading-none tracking-tight">
          {title}
        </h1>
        {description ? <p className="pt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="pb-3">{action}</div> : null}
    </div>
  );
}
