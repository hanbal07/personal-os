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

    const skills = await db.skill.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      include: {
        topics: { orderBy: { order: "asc" } },
        sessions: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      },
    });

    const skillsWithStats = skills.map((skill) => {
      const recentSessions = skill.sessions;
      const practiceHours = recentSessions.reduce((sum: number, s: { durationMins: number }) => sum + s.durationMins, 0) / 60;
      const lastSession = skill.sessions.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const currentTopic = skill.topics.find((t) => t.status === "IN_PROGRESS");
      const nextTopic = skill.topics.find((t) => t.status === "NOT_STARTED");
      // Derive totals from real topic rows — the denormalized columns can drift.
      const realTotal = skill.topics.length;
      const realComplete = skill.topics.filter((t) => t.status === "COMPLETED").length;

      return {
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        phase: skill.phase,
        level: skill.level,
        progress: realTotal > 0 ? Math.round((realComplete / realTotal) * 100) : 0,
        topicsCompleted: realComplete,
        topicsTotal: realTotal,
        practiceHours: Math.round(practiceHours * 10) / 10,
        projectCount: 0,
        lastStudied: lastSession ? lastSession.date.toISOString().split("T")[0] : null,
        currentTopic: currentTopic?.title || "-",
        nextTopic: nextTopic?.title || "-",
        topics: skill.topics.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          phase: t.phase,
          order: t.order,
          durationMins: t.durationMins,
          description: t.description,
        })),
      };
    });

    return NextResponse.json({ skills: skillsWithStats });
  } catch (error) {
    console.error("Skills GET error:", error);
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
    const body = await request.json();
    const { name, slug, description, phase, topicsTotal } = body;

    const maxOrder = await db.skill.findFirst({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const skill = await db.skill.create({
      data: {
        userId,
        name,
        slug,
        description,
        phase: phase || "FUNDAMENTALS",
        topicsTotal: topicsTotal || 0,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ skill });
  } catch (error) {
    console.error("Skills POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}