"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Feather, Target, CheckCircle2, Circle, Clock } from "lucide-react";
import { useState } from "react";

export default function QuranDaroodPage() {
  const [quranPages, setQuranPages] = useState(4);
  const [quranTarget] = useState(10);
  const [daroodCount, setDaroodCount] = useState(11);
  const [daroodTarget] = useState(33);

  const [weekData, setWeekData] = useState([
    { day: "Mon", quran: true, darood: 33 },
    { day: "Tue", quran: true, darood: 33 },
    { day: "Wed", quran: true, darood: 22 },
    { day: "Thu", quran: true, darood: 33 },
    { day: "Fri", quran: false, darood: 11 },
    { day: "Sat", quran: true, darood: 33 },
    { day: "Sun", quran: false, darood: 11 },
  ]);

  const quranProgress = Math.round((quranPages / quranTarget) * 100);
  const daroodProgress = Math.round((daroodCount / daroodTarget) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Quran & Darood-e-Pak</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Daily spiritual routine tracking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  Quran Reading
                </CardTitle>
                <Badge variant={quranProgress >= 100 ? "success" : "secondary"}>
                  {quranPages} / {quranTarget} pages
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={quranProgress} variant={quranProgress >= 100 ? "success" : "default"} />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuranPages(Math.max(0, quranPages - 1))}
                >
                  -1
                </Button>
                <Input
                  type="number"
                  value={quranPages}
                  onChange={(e) => setQuranPages(parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuranPages(quranPages + 1)}
                >
                  +1
                </Button>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  Tip: Even reading 1 page daily maintains consistency.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Feather className="h-4 w-4 text-yellow-400" />
                  Darood-e-Pak
                </CardTitle>
                <Badge variant={daroodProgress >= 100 ? "success" : "secondary"}>
                  {daroodCount} / {daroodTarget}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={daroodProgress} variant={daroodProgress >= 100 ? "success" : "default"} />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDaroodCount(Math.max(0, daroodCount - 1))}
                >
                  -1
                </Button>
                <Input
                  type="number"
                  value={daroodCount}
                  onChange={(e) => setDaroodCount(parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDaroodCount(daroodCount + 1)}
                >
                  +1
                </Button>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  After Maghrib is the dedicated Darood time. Target: 33 daily.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {weekData.map((day, i) => (
                <div
                  key={i}
                  className="text-center p-3 rounded-lg bg-zinc-800/50 space-y-2"
                >
                  <div className="text-xs text-zinc-500 font-medium">
                    {day.day}
                  </div>
                  <div className="flex justify-center">
                    {day.quran ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {day.darood}/{33}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
