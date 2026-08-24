import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "destructive";
}

function Progress({
  className,
  value = 0,
  max = 100,
  variant = "default",
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const barVariants = {
    default: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-error",
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-surface2", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", barVariants[variant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { Progress };
