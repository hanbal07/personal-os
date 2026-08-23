import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodayDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : getTodayDate();

    const sessions = await db.learningSession.findMany({
      where: { userId, date },
      include: { skill: true },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Learning sessions GET error:", error);
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
    let body: { skillId?: unknown; date?: unknown; sessionType?: unknown; topic?: unknown; durationMins?: unknown; notes?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { skillId, date, sessionType, topic, durationMins, notes } = body;

    const VALID_SESSION_TYPES = ["LEARNING", "PRACTICE", "BUILDING", "REVIEW", "DOCUMENTATION"];
    if (typeof skillId !== "string" || !skillId) {
      return NextResponse.json({ error: "skillId is required" }, { status: 400 });
    }
    if (typeof date !== "string" || isNaN(new Date(`${date}T12:00:00`).getTime())) {
      return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
    }
    if (sessionType !== undefined && !VALID_SESSION_TYPES.includes(sessionType as string)) {
      return NextResponse.json({ error: `sessionType must be one of: ${VALID_SESSION_TYPES.join(", ")}` }, { status: 400 });
    }
    const mins = Number(durationMins);
    if (!Number.isInteger(mins) || mins <= 0 || mins > 24 * 60) {
      return NextResponse.json({ error: "durationMins must be a positive integer (max 1440)" }, { status: 400 });
    }

    const skill = await db.skill.findUnique({ where: { id: skillId } });
    if (!skill || skill.userId !== userId) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const learningSession = await db.learningSession.create({
      data: {
        userId,
        skillId,
        date: new Date(`${date}T12:00:00`),
        sessionType: (sessionType as string) ?? "LEARNING",
        topic: typeof topic === "string" ? topic : null,
        durationMins: mins,
        notes: typeof notes === "string" ? notes : null,
      },
      include: { skill: true },
    });

    await db.skill.update({
      where: { id: skillId },
      data: {
        practiceHours: { increment: durationMins / 60 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ session: learningSession });
  } catch (error) {
    console.error("Learning session POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}