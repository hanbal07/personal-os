"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
