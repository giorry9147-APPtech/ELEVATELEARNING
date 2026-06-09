import * as React from "react";
import { cn } from "./cn";

/** Witte, rond-afgeronde kaart met zachte schaduw — de basisbouwsteen. */
export function Card({
  className,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <Tag
      className={cn(
        "rounded-3xl border border-border bg-surface shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

/** Subtielere kaart-variant (zachte glas-look op de luchtachtergrond). */
export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/60 bg-white/70 shadow-soft backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}
