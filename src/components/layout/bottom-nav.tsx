"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Calendar, Target, FolderKanban, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

const primaryItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/routine", label: "Today", icon: Calendar },
  { href: "/learning", label: "Learn", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = !primaryItems.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setMoreOpen(false)} />
      )}

      {/* Full menu sheet (replaces the old floating hamburger drawer on mobile) */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-zinc-800 bg-zinc-950 transition-transform duration-200",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
        aria-hidden={!moreOpen}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-4">
          <span className="text-sm font-semibold text-white">All pages</span>
          <button
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-1 px-3 pb-24 pt-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                  isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-zinc-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav
        aria-label="Primary"
        className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5">
          {primaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Open all pages menu"
            aria-expanded={moreOpen}
            className={cn(
              "flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
              moreActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}