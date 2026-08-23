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
      className: "bg-emerald-900/50 text-emerald-400 border-emerald-800/50",
      dot: "bg-emerald-400",
    },
    PARTIAL: {
      label: "Partial",
      className: "bg-yellow-900/50 text-yellow-400 border-yellow-800/50",
      dot: "bg-yellow-400",
    },
    MISSED: {
      label: "Missed",
      className: "bg-red-900/50 text-red-400 border-red-800/50",
      dot: "bg-red-400",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-blue-900/50 text-blue-400 border-blue-800/50",
      dot: "bg-blue-400",
    },
    NOT_STARTED: {
      label: "Not Started",
      className: "bg-zinc-800/50 text-zinc-400 border-zinc-700/50",
      dot: "bg-zinc-400",
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
