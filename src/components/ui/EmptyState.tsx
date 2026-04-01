import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-bg-panel/55 p-6 text-center shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
      <p className="text-sm font-semibold text-bg-soft">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-bg-soft/65">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

