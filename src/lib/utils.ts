import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getDateRange(days: number): { start: Date; end: Date } {
  const end = getTodayDate();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { start, end };
}

export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const sorted = dates
    .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
    .sort((a, b) => b - a);

  let streak = 1;
  const today = getTodayDate().getTime();

  if (sorted[0] !== today) return 0;

  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i - 1] - sorted[i]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calculatePercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
