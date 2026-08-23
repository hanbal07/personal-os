"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FolderKanban, Plus, Github, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  skills: string | null;
  technologies: string | null;
  phase: string;
  completion: number;
  githubUrl: string | null;
}

const PHASES = ["IDEA", "PLANNING", "DEVELOPMENT", "TESTING", "DOCUMENTATION", "GITHUB", "COMPLETED"];

const phaseOptions = PHASES.map((p) => ({ value: p, label: p }));

const phaseColors: Record<string, string> = {
  IDEA: "bg-zinc-800 text-zinc-400",
  PLANNING: "bg-blue-900/50 text-blue-400",
  DEVELOPMENT: "bg-yellow-900/50 text-yellow-400",
  TESTING: "bg-orange-900/50 text-orange-400",
  DOCUMENTATION: "bg-purple-900/50 text-purple-400",
  GITHUB: "bg-cyan-900/50 text-cyan-400",
  COMPLETED: "bg-emerald-900/50 text-emerald-400",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", skills: "", technologies: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      setError("Failed to load projects. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createProject = async () => {
    if (creating) return;
    if (!form.title.trim()) {
      setError("Project title is required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setShowNewProject(false);
      setForm({ title: "", description: "", skills: "", technologies: "" });
      load();
    } catch {
      setError("Could not create the project. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const patch = async (id: string, data: Record<string, unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      load();
    } catch {
      setError("Could not update the project. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (project: Project) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setBusyId(project.id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProjects((p) => p.filter((x) => x.id !== project.id));
    } catch {
      setError("Could not delete the project. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Idea → Planning → Development → Testing → Documentation → GitHub → Done
            </p>
          </div>
          <Button onClick={() => setShowNewProject(!showNewProject)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {showNewProject && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Project title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input placeholder="Skills (free text)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                <Input placeholder="Technologies (free text)" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={createProject} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
                </Button>
                <Button variant="ghost" onClick={() => setShowNewProject(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card><CardContent className="p-6 text-sm text-zinc-500">Loading projects…</CardContent></Card>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-2">
              <FolderKanban className="h-8 w-8 text-zinc-700 mx-auto" />
              <p className="text-sm text-zinc-500">
                No projects yet. Create your first one — it starts in the IDEA phase.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{project.title}</CardTitle>
                      {project.description && (
                        <p className="text-xs text-zinc-500 mt-1">{project.description}</p>
                      )}
                    </div>
                    <Badge className={phaseColors[project.phase]}>{project.phase}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={project.completion} variant={project.completion >= 100 ? "success" : "default"} />

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-44">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">Phase</label>
                      <Select
                        options={phaseOptions}
                        value={project.phase}
                        onChange={(e) => patch(project.id, { phase: e.target.value })}
                        disabled={busyId === project.id}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">% Done</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={project.completion}
                        onBlur={(e) => {
                          const v = parseInt(e.target.value);
                          if (Number.isInteger(v) && v >= 0 && v <= 100 && v !== project.completion) {
                            patch(project.id, { completion: v });
                          }
                        }}
                        disabled={busyId === project.id}
                      />
                    </div>
                  </div>

                  {(project.skills || project.technologies) && (
                    <p className="text-xs text-zinc-600">
                      {[project.skills, project.technologies].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    {project.githubUrl ? (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Github className="h-3.5 w-3.5 mr-1" />
                          GitHub
                        </Button>
                      </a>
                    ) : (
                      <span />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Delete project ${project.title}`}
                      onClick={() => remove(project)}
                      disabled={busyId === project.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}