"use client";

import { AppShell } from "@/components/layout/app-shell";
import { NamazTracker } from "@/components/faith/namaz-tracker";

export default function NamazPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Namaz</h1>
          <p className="mt-1 text-sm text-muted">
            Record each prayer as complete, partial, or missed — times are calculated for your location.
          </p>
        </div>
        <NamazTracker />
      </div>
    </AppShell>
  );
}
