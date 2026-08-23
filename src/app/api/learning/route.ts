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
    const body = await request.json();
    const { skillId, date, sessionType, topic, durationMins, notes } = body;

    const learningSession = await db.learningSession.create({
      data: {
        userId,
        skillId,
        date: new Date(date),
        sessionType,
        topic,
        durationMins,
        notes,
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