import {
  House,
  CalendarDays,
  MoonStar,
  GraduationCap,
  HeartPulse,
  FolderKanban,
  ChartLine,
  Calendar,
  History,
  ClipboardCheck,
  Brain,
  Users,
  Settings,
} from "lucide-react";

/** Primary workspaces — one domain per space. */
export const primaryNav = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/routine", label: "Today", icon: CalendarDays },
  { href: "/faith", label: "Faith", icon: MoonStar },
  { href: "/learning", label: "Learning", icon: GraduationCap },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/analytics", label: "Insights", icon: ChartLine },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

/** Supporting pages — kept out of the primary flow. */
export const secondaryNav = [
  { href: "/review", label: "Daily Review", icon: ClipboardCheck },
  { href: "/history", label: "History", icon: History },
  { href: "/ai-analysis", label: "AI Analysis", icon: Brain },
  { href: "/leadership", label: "Leadership", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const allNav = [...primaryNav, ...secondaryNav];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function pageTitleFor(pathname: string): string | undefined {
  return allNav.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.label;
}
