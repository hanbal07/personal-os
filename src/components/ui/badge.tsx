import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "accent";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface2 text-muted border-line",
    secondary: "bg-paper text-faint border-line",
    destructive: "bg-error-tint text-error border-error/25",
    outline: "text-muted border-line",
    success: "bg-success-tint text-success border-success/25",
    warning: "bg-warning-tint text-warning border-warning/30",
    accent: "bg-accent-tint text-accent border-accent/25",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
