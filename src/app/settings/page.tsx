"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Settings, User, Clock, MapPin, Bell, Moon, Target, Shield, Download } from "lucide-react";
import { useState } from "react";

const timezones = [
  { value: "Asia/Karachi", label: "Asia/Karachi (PKT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (AST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
];

const calcMethods = [
  { value: "Karachi", label: "Karachi" },
  { value: "MWL", label: "Muslim World League" },
  { value: "ISNA", label: "ISNA" },
  { value: "Egypt", label: "Egyptian" },
  { value: "Makkah", label: "Umm Al-Qura" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    name: "User",
    timezone: "Asia/Karachi",
    location: "Lahore, Pakistan",
    latitude: "31.5204",
    longitude: "74.3587",
    prayerMethod: "Karachi",
    juristicMethod: "Hanafi",
    wakeTime: "05:00",
    sleepTime: "21:00",
    learningHours: "8",
    walkingTarget: "30",
    workoutTarget: "45",
    strictMode: true,
    notifications: true,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure your PersonalOS</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-500" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Name</label>
                <Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Timezone</label>
                <Select options={timezones} value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-500" />
                Location & Prayer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Location</label>
                <Input value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Latitude</label>
                  <Input value={settings.latitude} onChange={(e) => setSettings({ ...settings, latitude: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Longitude</label>
                  <Input value={settings.longitude} onChange={(e) => setSettings({ ...settings, longitude: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Calculation Method</label>
                <Select options={calcMethods} value={settings.prayerMethod} onChange={(e) => setSettings({ ...settings, prayerMethod: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Wake Time</label>
                  <Input type="time" value={settings.wakeTime} onChange={(e) => setSettings({ ...settings, wakeTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Sleep Time</label>
                  <Input type="time" value={settings.sleepTime} onChange={(e) => setSettings({ ...settings, sleepTime: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Daily Learning Target (hours)</label>
                <Input type="number" value={settings.learningHours} onChange={(e) => setSettings({ ...settings, learningHours: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Walking (min)</label>
                  <Input type="number" value={settings.walkingTarget} onChange={(e) => setSettings({ ...settings, walkingTarget: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Workout (min)</label>
                  <Input type="number" value={settings.workoutTarget} onChange={(e) => setSettings({ ...settings, workoutTarget: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-zinc-500" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Strict Mode</p>
                  <p className="text-xs text-zinc-500">Highlight missed tasks and show warnings</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, strictMode: !settings.strictMode })}
                  className={`w-11 h-6 rounded-full transition-colors ${settings.strictMode ? "bg-white" : "bg-zinc-700"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-zinc-950 transition-transform ${settings.strictMode ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Notifications</p>
                  <p className="text-xs text-zinc-500">Prayer and task reminders</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                  className={`w-11 h-6 rounded-full transition-colors ${settings.notifications ? "bg-white" : "bg-zinc-700"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-zinc-950 transition-transform ${settings.notifications ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button>Save Settings</Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
