"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNav, secondaryNav, isActivePath } from "./nav-items";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-line bg-surface2 transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hero">
              <Zap className="h-4.5 w-4.5 text-paper" size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-ink">PersonalOS</h1>
              <p className="text-[10px] uppercase tracking-[0.14em] text-faint">Command Center</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-faint hover:bg-surface hover:text-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Primary workspaces">
          {primaryNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface text-accent shadow-[0_1px_2px_rgba(28,28,28,0.05)]"
                    : "text-muted hover:bg-surface/70 hover:text-ink"
                )}
              >
                {active && (
                  <span aria-hidden="true" className="absolute left-0 h-5 w-[3px] rounded-full bg-accent" />
                )}
                <item.icon className={cn("h-4 w-4", active ? "text-accent" : "text-faint")} />
                {item.label}
              </Link>
            );
          })}

          <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            More
          </p>
          {secondaryNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-surface font-medium text-accent shadow-[0_1px_2px_rgba(28,28,28,0.05)]"
                    : "text-faint hover:bg-surface/70 hover:text-ink"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-faint">Discipline over motivation</p>
        </div>
      </aside>
    </>
  );
}
