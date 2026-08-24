"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <Header onMenu={() => setMobileOpen(true)} />
        <main id="main-content" className="mx-auto w-full max-w-6xl p-4 pb-28 sm:p-6 lg:p-8 lg:pb-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
