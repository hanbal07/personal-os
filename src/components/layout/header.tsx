"use client";

import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "PersonalOS";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8">
      <div className="lg:hidden w-10" />
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-xs text-zinc-500">{formatDate(new Date())}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
