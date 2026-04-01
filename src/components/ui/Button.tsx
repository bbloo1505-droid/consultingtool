import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-brand-dark shadow-[0_10px_24px_rgba(2,6,23,0.12)] hover:bg-brand-primary-hover",
  secondary:
    "border border-border bg-surface/10 text-bg-soft hover:bg-surface/15",
  ghost: "text-bg-soft/80 hover:bg-surface/10 hover:text-bg-soft",
  danger:
    "border border-danger/40 bg-danger/15 text-bg-soft hover:bg-danger/20",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}) {
  return (
    <button
      {...props}
      className={[base, variantClass[variant], sizeClass[size], className ?? ""].join(" ")}
    >
      {leftIcon ? <span className="text-[0.95em] opacity-90">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="text-[0.95em] opacity-90">{rightIcon}</span> : null}
    </button>
  );
}

