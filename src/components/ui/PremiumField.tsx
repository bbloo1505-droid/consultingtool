import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function FieldLabel({
  label,
  hint,
  rightSlot,
}: {
  label: string;
  hint?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-bg-soft/85">{label}</p>
        {hint ? <p className="mt-0.5 text-xs leading-snug text-bg-soft/60">{hint}</p> : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

const controlBase =
  "focus-ring h-10 w-full rounded-[14px] border border-border bg-surface/10 px-3 text-sm text-bg-soft placeholder:text-bg-soft/40 transition";

export function PremiumInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={[controlBase, props.className ?? ""].join(" ")} />;
}

export function PremiumDateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type={props.type ?? "date"}
      className={[controlBase, "pr-2", props.className ?? ""].join(" ")}
    />
  );
}

export function PremiumSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        controlBase,
        "appearance-none pr-9 [&>option]:text-text-strong",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

