"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FolderKanban, Plus, ExternalLink, Github, Target, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useState } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  technologies: string[];
  phase: string;
  completion: number;
  githubUrl?: string;
  tasks: { title: string; completed: boolean }[];
}

const projects: Project[] = [
  {
    id: "1",
    title: "Python Calculator",
    description: "A command-line calculator with basic arithmetic operations",
    skills: ["Python", "Functions", "User Input"],
    technologies: ["Python"],
    phase: "COMPLETED",
    completion: 100,
    githubUrl: "https://github.com/user/calculator",
    tasks: [
      { title: "Basic operations", completed: true },
      { title: "Error handling", completed: true },
      { title: "History feature", completed: true },
      { title: "README documentation", completed: true },
    ],
  },
  {
    id: "2",
    title: "Todo CLI App",
    description: "A command-line todo application with JSON storage",
    skills: ["Python", "File Handling", "JSON"],
    technologies: ["Python", "JSON"],
    phase: "DEVELOPMENT",
    completion: 40,
    tasks: [
      { title: "Add/remove tasks", completed: true },
      { title: "List tasks", completed: true },
      { title: "Mark complete", completed: false },
      { title: "JSON persistence", completed: false },
      { title: "Due dates", completed: false },
    ],
  },
  {
    id: "3",
    title: "Weather CLI",
    description: "Fetch weather data from an API using Python",
    skills: ["Python", "APIs", "HTTP Requests"],
    technologies: ["Python", "Requests API"],
    phase: "IDEA",
    completion: 0,
    tasks: [
      { title: "API integration", completed: false },
      { title: "Location input", completed: false },
      { title: "Display results", completed: false },
    ],
  },
];

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
  const [showNewProject, setShowNewProject] = useState(false);

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

        {showNewProject && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Project title" />
              <Textarea placeholder="Description" />
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Skills (comma separated)" />
                <Input placeholder="Technologies (comma separated)" />
              </div>
              <div className="flex gap-2">
                <Button>Create Project</Button>
                <Button variant="ghost" onClick={() => setShowNewProject(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{project.title}</CardTitle>
                    <p className="text-xs text-zinc-500 mt-1">
                      {project.description}
                    </p>
                  </div>
                  <Badge className={phaseColors[project.phase]}>
                    {project.phase}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={project.completion} />

                <div className="flex flex-wrap gap-1.5">
                  {project.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px]">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">
                    Tasks
                  </p>
                  {project.tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {task.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                      <span
                        className={`text-xs ${
                          task.completed
                            ? "text-zinc-500 line-through"
                            : "text-zinc-400"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>

                {project.githubUrl && (
                  <div className="pt-2 border-t border-zinc-800 flex gap-2">
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Github className="h-3.5 w-3.5 mr-1" />
                        GitHub
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
