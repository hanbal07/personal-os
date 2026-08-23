import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { tasks: { orderBy: { order: "asc" } } },
    });

    const projectsWithStats = projects.map((p) => ({
      ...p,
      tasksTotal: p.tasks.length,
      tasksCompleted: p.tasks.filter((t: { completed: boolean }) => t.completed).length,
    }));

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    let body: { title?: unknown; description?: unknown; skills?: unknown; technologies?: unknown; startDate?: unknown; targetDate?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (body.description !== undefined && typeof body.description !== "string") {
      return NextResponse.json({ error: "description must be a string" }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        userId,
        title: body.title.trim(),
        description: typeof body.description === "string" ? body.description : null,
        skills: typeof body.skills === "string" ? body.skills : null,
        technologies: typeof body.technologies === "string" ? body.technologies : null,
        startDate: body.startDate ? new Date(body.startDate as string) : null,
        targetDate: body.targetDate ? new Date(body.targetDate as string) : null,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}