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
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        {kicker ? (
          <span className="text-sm font-medium text-muted-foreground">{kicker}</span>
        ) : null}
        <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
