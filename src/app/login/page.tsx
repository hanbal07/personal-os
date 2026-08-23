"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (email === "user@personalos.dev" && password === "password") {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials. Try user@personalos.dev / password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-white flex items-center justify-center">
            <Zap className="h-7 w-7 text-zinc-950" />
          </div>
          <div>
            <CardTitle className="text-xl">PersonalOS</CardTitle>
            <CardDescription className="mt-1">
              Your Personal Command Center
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@personalos.dev"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-xs text-zinc-600 text-center">
              Demo: user@personalos.dev / password
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
