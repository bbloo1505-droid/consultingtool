import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        title="QLD environmental screening"
        subtitle="Printable summary - MSES intersections for your area of interest"
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
