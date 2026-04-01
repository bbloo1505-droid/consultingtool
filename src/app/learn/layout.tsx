import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Learn · Term 1">
      <div className="rounded-[18px] border border-border bg-surface p-5 text-text-strong shadow-[0_14px_32px_rgba(2,6,23,0.16)]">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3 text-sm font-semibold print:hidden">
          <Link href="/" className="text-text-muted underline-offset-2 hover:underline">
            ← Screening
          </Link>
          <Link href="/learn" className="text-text-muted underline-offset-2 hover:underline">
            All weeks
          </Link>
          <Link href="/learn/review" className="text-text-muted underline-offset-2 hover:underline">
            Review queue
          </Link>
          <Link href="/learn/mixed-quiz" className="text-text-muted underline-offset-2 hover:underline">
            Mixed quiz
          </Link>
          <Link href="/learn/session" className="text-text-muted underline-offset-2 hover:underline">
            Timed session
          </Link>
          <Link href="/report" className="text-text-muted underline-offset-2 hover:underline">
            Report
          </Link>
          <Link href="/compare" className="text-text-muted underline-offset-2 hover:underline">
            Compare
          </Link>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
