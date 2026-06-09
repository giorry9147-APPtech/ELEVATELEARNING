import * as React from "react";
import { cn } from "./cn";

export type BadgeVariant = "brand" | "muted" | "success" | "warning" | "accent";

const variants: Record<BadgeVariant, string> = {
  brand: "bg-brand-soft text-brand-strong",
  muted: "bg-muted text-muted-foreground",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-warning",
  accent: "bg-violet-50 text-accent",
};

export function Badge({
  variant = "brand",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
