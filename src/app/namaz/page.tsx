"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Moon, Clock, MapPin, Settings2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface PrayerTime {
  name: string;
  time: string;
  status: "completed" | "missed" | "pending" | "upcoming";
}

const calculationMethods = [
  { value: "Karachi", label: "Karachi (University of Islamic Sciences)" },
  { value: "MWL", label: "Muslim World League" },
  { value: "ISNA", label: "ISNA (North America)" },
  { value: "Egypt", label: "Egyptian General Authority" },
  { value: "Makkah", label: "Umm Al-Qura University" },
  { value: "Tehran", label: "Institute of Geophysics" },
  { value: "Jafari", label: "Ja'fari (Shia)" },
];

const juristicMethods = [
  { value: "Hanafi", label: "Hanafi" },
  { value: "Shafi", label: "Shafi'i / Maliki / Hanbali" },
];

export default function NamazPage() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([
    { name: "Fajr", time: "4:45 AM", status: "completed" },
    { name: "Sunrise", time: "6:10 AM", status: "completed" },
    { name: "Dhuhr", time: "12:15 PM", status: "completed" },
    { name: "Asr", time: "3:45 PM", status: "upcoming" },
    { name: "Maghrib", time: "6:30 PM", status: "pending" },
    { name: "Isha", time: "8:00 PM", status: "pending" },
  ]);

  const [location, setLocation] = useState("Lahore, Pakistan");
  const [method, setMethod] = useState("Karachi");
  const [madhab, setMadhab] = useState("Hanafi");

  const togglePrayer = (name: string) => {
    setPrayers((prev) =>
      prev.map((p) => {
        if (p.name !== name) return p;
        if (p.status === "completed") return { ...p, status: "missed" as const };
        if (p.status === "missed") return { ...p, status: "pending" as const };
        return { ...p, status: "completed" as const };
      })
    );
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "missed":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "upcoming":
        return <Clock className="h-5 w-5 text-yellow-400" />;
      default:
        return <Circle className="h-5 w-5 text-zinc-600" />;
    }
  };

  const completedCount = prayers.filter(
    (p) => p.status === "completed" && p.name !== "Sunrise"
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Namaz</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {completedCount} of 5 prayers completed today
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {prayers.map((prayer) => (
              <Card
                key={prayer.name}
                className={
                  prayer.status === "completed"
                    ? "border-emerald-900/30"
                    : prayer.status === "missed"
                    ? "border-red-900/30"
                    : prayer.status === "upcoming"
                    ? "border-yellow-900/30"
                    : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {statusIcon(prayer.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {prayer.name}
                        </h3>
                        <p className="text-sm text-zinc-500">{prayer.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prayer.name !== "Sunrise" && (
                        <Button
                          variant={
                            prayer.status === "completed"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => togglePrayer(prayer.name)}
                        >
                          {prayer.status === "completed"
                            ? "Completed"
                            : prayer.status === "missed"
                            ? "Mark Completed"
                            : "Mark Complete"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  Location & Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">
                    Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">
                    Calculation Method
                  </label>
                  <Select
                    options={calculationMethods}
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">
                    Juristic Method
                  </label>
                  <Select
                    options={juristicMethods}
                    value={madhab}
                    onChange={(e) => setMadhab(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Weekly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <div
                      key={i}
                      className={`text-center p-2 rounded-lg text-xs ${
                        i < 5
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      <div className="font-medium">{day}</div>
                      <div className="mt-1">
                        {i < 5 ? `${5}/5` : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
