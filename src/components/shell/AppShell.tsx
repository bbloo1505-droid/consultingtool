import type { ReactNode } from "react";
import { AppHeader } from "@/components/shell/AppHeader";

type AppShellProps = {
  title: string;
  headerRightSlot?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, headerRightSlot, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-main text-bg-soft">
      <AppHeader title={title} rightSlot={headerRightSlot} />
      <main className="mx-auto max-w-[1440px] px-4 py-5">{children}</main>
    </div>
  );
}

