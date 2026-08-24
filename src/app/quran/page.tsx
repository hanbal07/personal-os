"use client";

import { AppShell } from "@/components/layout/app-shell";
import { QuranDaroodTrackers } from "@/components/faith/quran-darood-trackers";

export default function QuranPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Quran</h1>
          <p className="mt-1 text-sm text-muted">
            Log your reading and Darood-e-Pak — entries save automatically.
          </p>
        </div>
        <QuranDaroodTrackers />
      </div>
    </AppShell>
  );
}
