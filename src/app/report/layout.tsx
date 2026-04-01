import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Report">
      <div className="py-2">{children}</div>
    </AppShell>
  );
}
