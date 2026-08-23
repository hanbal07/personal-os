"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Heart, Footprints, Dumbbell, Droplets, Utensils, BedDouble, Scale } from "lucide-react";
import { useState } from "react";

export default function HealthPage() {
  const [walkingMins, setWalkingMins] = useState(25);
  const [walkingTarget] = useState(30);
  const [workoutMins, setWorkoutMins] = useState(0);
  const [workoutTarget] = useState(45);
  const [water, setWater] = useState(4);
  const [waterTarget] = useState(8);
  const [weight, setWeight] = useState("105");
  const [meals, setMeals] = useState({
    breakfast: "Roti + Salan + 1 cup tea",
    lunch: "",
    snack: "",
    dinner: "",
  });
  const [mealNotes, setMealNotes] = useState("");

  const walkingProgress = Math.round((walkingMins / walkingTarget) * 100);
  const workoutProgress = Math.round((workoutMins / workoutTarget) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Health & Fitness</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Sustainable habits for a healthier life
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                  <Footprints className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Walking</p>
                  <p className="text-lg font-bold text-white">
                    {walkingMins}/{walkingTarget} min
                  </p>
                </div>
              </div>
              <Progress value={walkingProgress} variant="success" />
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setWalkingMins(Math.max(0, walkingMins - 5))}>-5</Button>
                <Button variant="outline" size="sm" onClick={() => setWalkingMins(walkingMins + 5)}>+5</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-orange-900/50 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Workout</p>
                  <p className="text-lg font-bold text-white">
                    {workoutMins}/{workoutTarget} min
                  </p>
                </div>
              </div>
              <Progress value={workoutProgress} variant={workoutProgress > 0 ? "success" : "default"} />
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setWorkoutMins(Math.max(0, workoutMins - 15))}>-15</Button>
                <Button variant="outline" size="sm" onClick={() => setWorkoutMins(workoutMins + 15)}>+15</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-900/50 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Water</p>
                  <p className="text-lg font-bold text-white">
                    {water}/{waterTarget} glasses
                  </p>
                </div>
              </div>
              <Progress value={Math.round((water / waterTarget) * 100)} />
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setWater(Math.max(0, water - 1))}>-1</Button>
                <Button variant="outline" size="sm" onClick={() => setWater(water + 1)}>+1</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-900/50 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Weight</p>
                  <p className="text-lg font-bold text-white">{weight} kg</p>
                </div>
              </div>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-2"
                placeholder="Weight in kg"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Utensils className="h-4 w-4 text-zinc-500" />
                Today&apos;s Meals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Breakfast (~8:00 AM)
                </label>
                <Input
                  value={meals.breakfast}
                  onChange={(e) =>
                    setMeals({ ...meals, breakfast: e.target.value })
                  }
                  placeholder="e.g., Roti + Salan + Tea"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Lunch (~12:00 PM)
                </label>
                <Input
                  value={meals.lunch}
                  onChange={(e) =>
                    setMeals({ ...meals, lunch: e.target.value })
                  }
                  placeholder="e.g., Roti + Salan + Salad"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Snack (Optional)
                </label>
                <Input
                  value={meals.snack}
                  onChange={(e) =>
                    setMeals({ ...meals, snack: e.target.value })
                  }
                  placeholder="e.g., Fruit, Nuts"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Dinner (~7:00 PM)
                </label>
                <Input
                  value={meals.dinner}
                  onChange={(e) =>
                    setMeals({ ...meals, dinner: e.target.value })
                  }
                  placeholder="e.g., Roti + Salan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Notes
                </label>
                <Textarea
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  placeholder="How did you feel? Any changes?"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i} className="text-center space-y-2">
                    <div className="text-xs text-zinc-500">{day}</div>
                    <div className="space-y-1">
                      <div
                        className={`h-8 rounded flex items-center justify-center text-[10px] ${
                          i < 6 ? "bg-blue-900/30 text-blue-400" : "bg-zinc-800 text-zinc-600"
                        }`}
                      >
                        Walk
                      </div>
                      <div
                        className={`h-8 rounded flex items-center justify-center text-[10px] ${
                          i < 5 ? "bg-orange-900/30 text-orange-400" : "bg-zinc-800 text-zinc-600"
                        }`}
                      >
                        Work
                      </div>
                      <div
                        className={`h-8 rounded flex items-center justify-center text-[10px] ${
                          i < 6 ? "bg-cyan-900/30 text-cyan-400" : "bg-zinc-800 text-zinc-600"
                        }`}
                      >
                        Water
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
