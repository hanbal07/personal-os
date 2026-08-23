"use client";

import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/routine": "Daily Routine",
  "/namaz": "Namaz",
  "/quran": "Quran & Darood",
  "/health": "Health & Fitness",
  "/learning": "Learning",
  "/projects": "Projects",
  "/analytics": "Analytics",
  "/calendar": "Calendar",
  "/history": "History",
  "/review": "Daily Review",
  "/ai-analysis": "AI Analysis",
  "/leadership": "Leadership",
  "/settings": "Settings",
};

export function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "PersonalOS";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-xs text-zinc-500">{formatDate(new Date())}</p>
        </div>
      </div>
    </header>
  );
}