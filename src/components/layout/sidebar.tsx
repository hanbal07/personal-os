"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  Menu,
  X,
  Zap,
  ClipboardCheck,
  Brain,
  History,
} from "lucide-react";
import { useState } from "react";

const navItems = [
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

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-800 text-white"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-200",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <Zap className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              PersonalOS
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              Command Center
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <item.icon
                  className={cn("h-4 w-4", isActive ? "text-white" : "text-zinc-600")}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-zinc-800">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider">
            Discipline over Motivation
          </div>
        </div>
      </aside>
    </>
  );
}
