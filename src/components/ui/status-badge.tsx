"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "COMPLETED" | "PARTIAL" | "MISSED" | "IN_PROGRESS" | "NOT_STARTED";
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    COMPLETED: {
      label: "Completed",
      className: "bg-success-tint text-success border-success/25",
      dot: "bg-success",
    },
    PARTIAL: {
      label: "Partial",
      className: "bg-warning-tint text-warning border-warning/25",
      dot: "bg-warning",
    },
    MISSED: {
      label: "Missed",
      className: "bg-error-tint text-error border-error/25",
      dot: "bg-error",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-accent-tint text-accent-strong border-accent/25",
      dot: "bg-accent",
    },
    NOT_STARTED: {
      label: "Not Started",
      className: "bg-surface2/50 text-muted border-line/50",
      dot: "bg-line",
    },
  };

  const { label, className: badgeClass, dot } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeClass,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

export { StatusBadge };
