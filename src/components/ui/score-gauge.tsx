"use client";

import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

function ScoreGauge({ score, size = "md", className, showLabel = true }: ScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 90) return { stroke: "#16a34a", bg: "text-success" };
    if (s >= 75) return { stroke: "#22c55e", bg: "text-success" };
    if (s >= 60) return { stroke: "#d97706", bg: "text-warning" };
    if (s >= 40) return { stroke: "#ea580c", bg: "text-warning" };
    return { stroke: "#dc2626", bg: "text-error" };
  };

  const getLabel = (s: number) => {
    if (s >= 90) return "Excellent";
    if (s >= 75) return "Good";
    if (s >= 60) return "Moderate";
    if (s >= 40) return "Needs Work";
    return "Critical";
  };

  const sizes = {
    sm: { outer: 60, strokeWidth: 4, text: "text-lg" },
    md: { outer: 100, strokeWidth: 6, text: "text-3xl" },
    lg: { outer: 140, strokeWidth: 8, text: "text-4xl" },
  };

  const { outer, strokeWidth: sw, text: textSize } = sizes[size];
  const radius = (outer - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { stroke, bg } = getColor(score);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg
          width={outer}
          height={outer}
          viewBox={`0 0 ${outer} ${outer}`}
          className="-rotate-90"
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth={sw}
          />
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-ink", textSize)}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn("mt-2 text-sm font-medium", bg)}>
          {getLabel(score)}
        </span>
      )}
    </div>
  );
}

export { ScoreGauge };
