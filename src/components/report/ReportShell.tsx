import Link from "next/link";
import type { ReactNode } from "react";

export function ReportShell({
  children,
  onPrint,
  onCopyMethods,
  onDownloadCsv,
}: {
  children: ReactNode;
  onPrint: () => void;
  onCopyMethods: () => void;
  onDownloadCsv: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[var(--report-muted)]">
          <Link className="underline-offset-2 hover:underline" href="/">
            Back to screening
          </Link>
          <Link className="underline-offset-2 hover:underline" href="/compare">
            Compare
          </Link>
          <Link className="underline-offset-2 hover:underline" href="/insights">
            Insights
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-[12px] border border-[var(--report-border)] bg-[var(--report-surface)] px-3 py-2 text-sm font-semibold text-[var(--report-ink)] hover:bg-[color-mix(in_srgb,var(--report-surface),#000_3%)]"
            onClick={onDownloadCsv}
          >
            Download CSV
          </button>
          <button
            type="button"
            className="rounded-[12px] border border-[var(--report-border)] bg-[var(--report-surface)] px-3 py-2 text-sm font-semibold text-[var(--report-ink)] hover:bg-[color-mix(in_srgb,var(--report-surface),#000_3%)]"
            onClick={onCopyMethods}
          >
            Copy methods
          </button>
          <button
            type="button"
            className="rounded-[12px] bg-[var(--report-brand)] px-3 py-2 text-sm font-semibold text-[var(--report-brand-dark)] hover:bg-[color-mix(in_srgb,var(--report-brand),#000_10%)]"
            onClick={onPrint}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

