"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems, brandIcon } from "./nav-items";

const BrandIcon = brandIcon;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar (always visible) / mobile drawer (state-controlled by Header) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <BrandIcon className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">PersonalOS</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
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

        <div className="border-t border-zinc-800 px-6 py-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600">
            Discipline over Motivation
          </div>
        </div>
      </aside>
    </>
  );
}