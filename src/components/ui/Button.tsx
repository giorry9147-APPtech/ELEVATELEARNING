import * as React from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "soft"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition " +
  "whitespace-nowrap select-none disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary:
    "bg-surface text-foreground border border-border shadow-soft hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  soft: "bg-brand-soft text-brand-strong hover:brightness-[0.98]",
  danger: "bg-danger text-white hover:brightness-105 shadow-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

/** Gedeelde classes zodat ook `<Link>` er als knop uit kan zien. */
export function buttonClasses(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
}): string {
  const { variant = "primary", size = "md", className, fullWidth } = opts ?? {};
  return cn(
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant, size, fullWidth, className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses({ variant, size, fullWidth, className })}
        {...props}
      />
    );
  },
);
