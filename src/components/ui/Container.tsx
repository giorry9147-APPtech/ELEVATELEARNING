import * as React from "react";
import { cn } from "./cn";

/** Gecentreerde inhoudsbreedte met consistente horizontale padding. */
export function Container({
  className,
  size = "lg",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "md" | "lg" | "xl" }) {
  const max = {
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
  }[size];
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-6", max, className)} {...props} />
  );
}

/** Kop voor een sectie: optioneel oogje (eyebrow) + titel + omschrijving. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "default",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  tone?: "default" | "light";
  className?: string;
}) {
  const light = tone === "light";
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-2 text-sm font-semibold tracking-wide uppercase",
            light ? "text-white/80" : "text-brand",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "text-3xl font-bold tracking-tight text-balance sm:text-4xl",
          light ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-3 text-lg text-pretty",
            light ? "text-white/85" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
