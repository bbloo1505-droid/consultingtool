import type { ReactNode } from "react";
import "./report.css";
import { AppShell } from "@/components/shell/AppShell";

export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Report">
      <div className="report rounded-[18px] border border-border bg-[var(--report-bg)] text-[var(--report-ink)] shadow-[0_14px_32px_rgba(2,6,23,0.16)] print:rounded-none print:border-0 print:shadow-none">
        {children}
      </div>
    </AppShell>
  );
}
