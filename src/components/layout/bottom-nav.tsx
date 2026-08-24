"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { House, CalendarDays, GraduationCap, FolderKanban, LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { allNav, isActivePath } from "./nav-items";

const primaryItems = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/routine", label: "Today", icon: CalendarDays },
  { href: "/learning", label: "Learn", icon: GraduationCap },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = !primaryItems.some((i) => isActivePath(pathname, i.href));

  return (
    <>
      {/* Full menu sheet */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity lg:hidden",
          moreOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMoreOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="All pages"
        aria-hidden={!moreOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface transition-transform duration-200 lg:hidden",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <span className="text-sm font-semibold text-ink">All pages</span>
          <button
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-muted hover:bg-surface2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-1 px-3 pb-28 pt-3">
          {allNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                  active ? "bg-accent-tint text-accent" : "text-muted hover:bg-surface2 hover:text-ink"
                )}
              >
                <item.icon className={cn("h-4 w-4", active ? "text-accent" : "text-faint")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5">
          {primaryItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                  active ? "text-accent" : "text-faint hover:text-muted"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
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
              moreActive ? "text-accent" : "text-faint hover:text-muted"
            )}
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={moreActive ? 2.25 : 1.75} />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
