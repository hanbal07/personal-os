import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_PHASES = ["IDEA", "PLANNING", "DEVELOPMENT", "TESTING", "DOCUMENTATION", "GITHUB", "COMPLETED"];

async function getOwnedProject(request: NextRequest, id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 401 as const };
  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) return { error: 404 as const };
  return { project, userId: session.user.id };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await getOwnedProject(request, id);
    if ("error" in res) {
      return NextResponse.json({ error: res.error === 401 ? "Unauthorized" : "Not found" }, { status: res.error });
    }
    return NextResponse.json({ project: res.project });
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await getOwnedProject(request, id);
    if ("error" in res) {
      return NextResponse.json({ error: res.error === 401 ? "Unauthorized" : "Not found" }, { status: res.error });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.description === "string" || body.description === null) data.description = body.description;
    if (typeof body.skills === "string" || body.skills === null) data.skills = body.skills;
    if (typeof body.technologies === "string" || body.technologies === null) data.technologies = body.technologies;
    if (typeof body.githubUrl === "string" || body.githubUrl === null) data.githubUrl = body.githubUrl;
    if (typeof body.demoUrl === "string" || body.demoUrl === null) data.demoUrl = body.demoUrl;
    if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;

    if (body.phase !== undefined) {
      if (typeof body.phase !== "string" || !VALID_PHASES.includes(body.phase)) {
        return NextResponse.json(
          { error: `Invalid phase. Must be one of: ${VALID_PHASES.join(", ")}` },
          { status: 400 }
        );
      }
      data.phase = body.phase;
    }

    if (body.completion !== undefined) {
      const completion = Number(body.completion);
      if (!Number.isInteger(completion) || completion < 0 || completion > 100) {
        return NextResponse.json({ error: "completion must be an integer between 0 and 100" }, { status: 400 });
      }
      data.completion = completion;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const project = await db.project.update({
      where: { id },
      data,
      include: { tasks: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await getOwnedProject(request, id);
    if ("error" in res) {
      return NextResponse.json({ error: res.error === 401 ? "Unauthorized" : "Not found" }, { status: res.error });
    }
    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}