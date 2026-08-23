import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FolderKanban,
  Heart,
  Moon,
  BarChart3,
  Settings,
  Target,
  Users,
  Zap,
  ClipboardCheck,
  Brain,
  History,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/routine", label: "Daily Routine", icon: Calendar },
  { href: "/namaz", label: "Namaz", icon: Moon },
  { href: "/quran", label: "Quran & Darood", icon: BookOpen },
  { href: "/health", label: "Health & Fitness", icon: Heart },
  { href: "/learning", label: "Learning", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/history", label: "History", icon: History },
  { href: "/review", label: "Daily Review", icon: ClipboardCheck },
  { href: "/ai-analysis", label: "AI Analysis", icon: Brain },
  { href: "/leadership", label: "Leadership", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const brandIcon = Zap;