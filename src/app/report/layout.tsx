import type { ReactNode } from "react";
import "./report.css";

export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="report min-h-screen bg-[var(--report-bg)] text-[var(--report-ink)]">
      {children}
    </div>
  );
}
