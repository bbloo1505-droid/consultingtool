import Image from "next/image";

export function ReportCover({
  title,
  subtitle,
  createdAtLabel,
  confidentialityNote = "Internal use only • Preliminary desktop screening",
}: {
  title: string;
  subtitle: string;
  createdAtLabel: string;
  confidentialityNote?: string;
}) {
  return (
    <header className="report-avoid-break rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.08)] print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-[180px]">
              <Image
                src="/bloom-foundry-logo.png"
                alt="Bloom Foundry"
                fill
                sizes="180px"
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden h-6 w-px bg-[var(--report-border)] sm:block" />
            <span className="rounded-full bg-[color-mix(in_srgb,var(--report-brand),#fff_86%)] px-3 py-1 text-xs font-semibold text-[var(--report-brand-dark)]">
              Environmental screening
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--report-ink)] print:text-[18pt]">
            {title}
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--report-muted)] print:text-[10pt]">
            {subtitle}
          </p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--report-muted)] print:text-[9pt]">
            {confidentialityNote}
          </p>
        </div>

        <div className="w-full max-w-[320px] rounded-[14px] border border-[var(--report-border)] bg-[var(--report-bg)] p-4 print:max-w-none print:bg-transparent">
          <p className="text-xs font-semibold text-[var(--report-muted)]">Report created</p>
          <p className="mt-1 text-sm font-semibold text-[var(--report-ink)]">{createdAtLabel}</p>
        </div>
      </div>
    </header>
  );
}

