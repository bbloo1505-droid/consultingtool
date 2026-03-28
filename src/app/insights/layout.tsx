import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        title="QLD environmental screening"
        subtitle="Data visualisations from your last screening run"
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
