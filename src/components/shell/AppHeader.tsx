import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  /** App/page title displayed in header. */
  title: string;
  /** Optional right-side content (actions, status). */
  rightSlot?: ReactNode;
};

function IconLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: ReactNode;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "focus-ring inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold transition",
        isActive
          ? "bg-surface/10 text-bg-soft"
          : "text-bg-soft/70 hover:bg-surface/10 hover:text-bg-soft",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function AppHeader({ title, rightSlot }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-main/92 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="focus-ring inline-flex items-center gap-3 rounded-lg pr-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-[10px] bg-surface/10 ring-1 ring-border">
              <Image
                src="/bloom-foundry-logo.png"
                alt="Bloom Foundry"
                fill
                sizes="32px"
                className="object-cover"
                priority
              />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-bg-soft sm:inline">
              Bloom Foundry
            </span>
          </Link>
          <span className="hidden h-6 w-px bg-border sm:block" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-bg-soft">{title}</p>
          </div>
        </div>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <IconLink href="/" isActive>
            Screening
          </IconLink>
          <IconLink href="/report">Report</IconLink>
          <IconLink href="/insights">Insights</IconLink>
          <IconLink href="/compare">Compare</IconLink>
          <IconLink href="/learn">Learn</IconLink>
        </nav>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
          {rightSlot}
        </div>
      </div>
    </header>
  );
}

