import Image from "next/image";

type SiteHeaderProps = {
  title: string;
  subtitle: string;
};

export function SiteHeader({ title, subtitle }: SiteHeaderProps) {
  return (
    <header className="border-b border-bloom-brown/20 bg-white/95 shadow-sm backdrop-blur-sm dark:border-bloom-gold/25 dark:bg-bloom-ink/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-bloom-brown/25 dark:bg-bloom-ink dark:ring-bloom-gold/35">
            <Image
              src="/bloom-sunflower.png"
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-bloom-brown dark:text-bloom-gold-light">
              Bloom Foundry
            </p>
            <h1 className="font-display mt-1 text-xl font-semibold leading-tight tracking-tight text-bloom-ink dark:text-bloom-cream">
              {title}
            </h1>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/80 sm:text-right">
          {subtitle}
        </p>
      </div>
    </header>
  );
}
