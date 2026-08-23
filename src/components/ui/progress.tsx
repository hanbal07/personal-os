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
    default: "bg-white",
    success: "bg-emerald-500",
    warning: "bg-yellow-500",
    destructive: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-zinc-800",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          barVariants[variant]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { Progress };
