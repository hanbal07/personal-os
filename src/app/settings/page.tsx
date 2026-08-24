"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { User, Clock, MapPin, Shield, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";

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

const juristicMethods = [
  { value: "Hanafi", label: "Hanafi" },
  { value: "Shafi", label: "Shafi'i / Maliki / Hanbali" },
];

interface SettingsForm {
  timezone: string;
  location: string;
  latitude: string;
  longitude: string;
  prayerCalcMethod: string;
  juristicMethod: string;
  wakeTime: string;
  sleepTime: string;
  dailyLearningHours: string;
  walkingTargetMins: string;
  workoutTargetMins: string;
  strictMode: boolean;
  notificationsOn: boolean;
}

const defaults: SettingsForm = {
  timezone: "Asia/Karachi",
  location: "",
  latitude: "",
  longitude: "",
  prayerCalcMethod: "Karachi",
  juristicMethod: "Hanafi",
  wakeTime: "05:00",
  sleepTime: "21:00",
  dailyLearningHours: "8",
  walkingTargetMins: "30",
  workoutTargetMins: "45",
  strictMode: true,
  notificationsOn: true,
};

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [settings, setSettings] = useState<SettingsForm>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const changePassword = async () => {
    if (pwSaving) return;
    setPwError(null);
    setPwSuccess(null);
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError("All three password fields are required.");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      setPwSuccess(data.message || "Password updated successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Could not change password.");
    } finally {
      setPwSaving(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [res, sessionRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/auth/session"),
        ]);
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setEmail(s?.user?.email || "");
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.settings) {
          setSettings({
            timezone: data.settings.timezone || defaults.timezone,
            location: data.settings.location || "",
            latitude: String(data.settings.latitude ?? ""),
            longitude: String(data.settings.longitude ?? ""),
            prayerCalcMethod: data.settings.prayerCalcMethod || "Karachi",
            juristicMethod: data.settings.juristicMethod || "Hanafi",
            wakeTime: data.settings.wakeTime || "05:00",
            sleepTime: data.settings.sleepTime || "21:00",
            dailyLearningHours: String(data.settings.dailyLearningHours ?? 8),
            walkingTargetMins: String(data.settings.walkingTargetMins ?? 30),
            workoutTargetMins: String(data.settings.workoutTargetMins ?? 45),
            strictMode: !!data.settings.strictMode,
            notificationsOn: data.settings.notificationsOn !== false,
          });
        }
      } catch {
        setError("Failed to load settings. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch {
      setError("Could not save settings. Check values and try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: "strictMode" | "notificationsOn") =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Settings</h1>
          <p className="text-sm text-muted mt-1">Configure your PersonalOS</p>
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="p-6 text-sm text-muted">Loading settings…</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-muted" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted uppercase tracking-wider">Account</label>
                    <Input value={email} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted uppercase tracking-wider">Timezone</label>
                    <Select options={timezones} value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted" />
                    Location & Prayer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted uppercase tracking-wider">Location</label>
                    <Input value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })} placeholder="Lahore, Pakistan" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted uppercase tracking-wider">Latitude</label>
                      <Input type="number" step="any" value={settings.latitude} onChange={(e) => setSettings({ ...settings, latitude: e.target.value })} placeholder="31.5204" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted uppercase tracking-wider">Longitude</label>
                      <Input type="number" step="any" value={settings.longitude} onChange={(e) => setSettings({ ...settings, longitude: e.target.value })} placeholder="74.3587" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted uppercase tracking-wider">Calculation Method</label>
                    <Select options={calcMethods} value={settings.prayerCalcMethod} onChange={(e) => setSettings({ ...settings, prayerCalcMethod: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted uppercase tracking-wider">Juristic Method</label>
                    <Select options={juristicMethods} value={settings.juristicMethod} onChange={(e) => setSettings({ ...settings, juristicMethod: e.target.value })} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted uppercase tracking-wider">Wake Time</label>
                      <Input type="time" value={settings.wakeTime} onChange={(e) => setSettings({ ...settings, wakeTime: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted uppercase tracking-wider">Sleep Time</label>
                      <Input type="time" value={settings.sleepTime} onChange={(e) => setSettings({ ...settings, sleepTime: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted uppercase tracking-wider">Daily Learning Target (hours)</label>
                    <Input type="number" min="0" max="24" value={settings.dailyLearningHours} onChange={(e) => setSettings({ ...settings, dailyLearningHours: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted uppercase tracking-wider">Walking Target (min)</label>
                      <Input type="number" min="0" max="600" value={settings.walkingTargetMins} onChange={(e) => setSettings({ ...settings, walkingTargetMins: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted uppercase tracking-wider">Workout Target (min)</label>
                      <Input type="number" min="0" max="600" value={settings.workoutTargetMins} onChange={(e) => setSettings({ ...settings, workoutTargetMins: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink">Strict Mode</p>
                      <p className="text-xs text-muted">Highlight missed tasks and show warnings</p>
                    </div>
                    <button
                      onClick={() => toggle("strictMode")}
                      className={`w-11 h-6 rounded-full transition-colors ${settings.strictMode ? "bg-accent" : "bg-line"}`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-surface shadow-sm transition-transform ${settings.strictMode ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink">Notifications</p>
                      <p className="text-xs text-muted">Prayer and task reminders</p>
                    </div>
                    <button
                      onClick={() => toggle("notificationsOn")}
                      className={`w-11 h-6 rounded-full transition-colors ${settings.notificationsOn ? "bg-accent" : "bg-line"}`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-surface shadow-sm transition-transform ${settings.notificationsOn ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : savedMsg ? "Saved ✓" : "Save Settings"}
              </Button>
              {!savedMsg && !error && (
                <span className="text-xs text-faint">Changes apply to your account immediately after saving.</span>
              )}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted" />
                  Security — Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                {pwSuccess && (
                  <div className="rounded-lg border border-success/30 bg-success-tint px-4 py-3 text-sm text-success">
                    {pwSuccess}
                  </div>
                )}
                {pwError && (
                  <div className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
                    {pwError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-wider">Current Password</label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-wider">New Password (min 8 chars)</label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-wider">Confirm New Password</label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  />
                </div>
                <Button onClick={changePassword} disabled={pwSaving}>
                  {pwSaving ? "Updating…" : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}