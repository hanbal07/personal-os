"use client";

import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Menu } from "lucide-react";
import { pageTitleFor } from "./nav-items";

export function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const title = pageTitleFor(pathname) || "PersonalOS";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onMenu}
          aria-label="Open navigation menu"
          className="rounded-lg border border-line bg-surface p-2 text-ink hover:bg-surface2 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <p className="text-xs text-faint">{formatDate(new Date())}</p>
        </div>
      </div>
    </header>
  );
}
