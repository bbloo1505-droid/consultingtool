import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Insights">
      <div className="rounded-[18px] border border-border bg-surface p-5 text-text-strong shadow-[0_14px_32px_rgba(2,6,23,0.16)]">
        {children}
      </div>
    </AppShell>
  );
}
