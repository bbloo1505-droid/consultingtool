import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        title="Learn · Term 1"
        subtitle="Graduate environmental consulting study track—weeks 1–13. Use Screening for map practice."
        className="print:hidden"
      />
      <div className="border-b border-bloom-brown/10 bg-bloom-cream/40 px-4 py-3 print:hidden dark:border-bloom-gold/15 dark:bg-bloom-ink/40">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
          <Link href="/" className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light">
            ← Screening (home)
          </Link>
          <Link href="/learn" className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light">
            All weeks
          </Link>
          <Link href="/learn/review" className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light">
            Review queue
          </Link>
          <Link href="/learn/mixed-quiz" className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light">
            Mixed quiz
          </Link>
          <Link href="/learn/session" className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light">
            Timed session
          </Link>
          <Link href="/report" className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light">
            Report
          </Link>
          <Link href="/compare" className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light">
            Compare
          </Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
