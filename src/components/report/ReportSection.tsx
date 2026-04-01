import type { ReactNode } from "react";

export function ReportSection({
  title,
  subtitle,
  children,
  id,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-8 print:mt-6 print:break-inside-avoid">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-text-strong print:text-[12.5pt]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-text-muted print:text-[10pt]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

