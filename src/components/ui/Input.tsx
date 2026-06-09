import * as React from "react";
import { cn } from "./cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-surface px-3.5 text-sm text-foreground",
        "placeholder:text-muted-foreground transition",
        "focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none",
        "disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground",
        "placeholder:text-muted-foreground transition",
        "focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none",
        "disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}
