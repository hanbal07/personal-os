import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: skillId } = await params;
    const skill = await db.skill.findUnique({ where: { id: skillId } });
    if (!skill || skill.userId !== session.user.id) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    let body: { topicId?: unknown; status?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { topicId, status } = body;
    if (typeof topicId !== "string") {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }
    if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const topic = await db.topic.findUnique({ where: { id: topicId } });
    if (!topic || topic.skillId !== skillId) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const updated = await db.topic.update({
      where: { id: topicId },
      data: {
        status: status as never,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    const completedCount = await db.topic.count({
      where: { skillId, status: "COMPLETED" },
    });

    await db.skill.update({
      where: { id: skillId },
      data: {
        topicsComplete: completedCount,
        topicsTotal: Math.max(skill.topicsTotal, completedCount),
      },
    });

    return NextResponse.json({ topic: updated, topicsComplete: completedCount });
  } catch (error) {
    console.error("Topic PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}