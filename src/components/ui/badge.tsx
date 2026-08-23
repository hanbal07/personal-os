import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    secondary: "bg-zinc-800/50 text-zinc-400 border-zinc-700/50",
    destructive: "bg-red-900/50 text-red-400 border-red-800/50",
    outline: "text-zinc-400 border-zinc-700",
    success: "bg-emerald-900/50 text-emerald-400 border-emerald-800/50",
    warning: "bg-yellow-900/50 text-yellow-400 border-yellow-800/50",
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
