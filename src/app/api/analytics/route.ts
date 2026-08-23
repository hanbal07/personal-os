import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodayDate, getDateRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");

    const { start, end } = getDateRange(days);

    const [
      disciplineScores,
      learningSessions,
      projects,
      prayerRecords,
      habits,
      walkingRecords,
      exerciseRecords,
      sleepRecords,
    ] = await Promise.all([
      db.disciplineScore.findMany({ where: { userId, date: { gte: start, lte: end } }, orderBy: { date: "asc" } }),
      db.learningSession.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.project.findMany({ where: { userId } }),
      db.prayerRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.habit.findMany({ where: { userId, active: true } }),
      db.walkingRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.exerciseRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.sleepRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    ]);

    const dailyHours: Record<string, number> = {};
    for (const session of learningSessions) {
      const dateStr = session.date.toISOString().split("T")[0];
      dailyHours[dateStr] = (dailyHours[dateStr] || 0) + session.durationMins / 60;
    }

    const disciplineTrend = disciplineScores.map((s) => ({
      date: s.date.toISOString().split("T")[0],
      score: s.score,
    }));

    const skillHours: Record<string, number> = {};
    for (const session of learningSessions) {
      const skill = await db.skill.findUnique({ where: { id: session.skillId } });
      if (skill) {
        skillHours[skill.name] = (skillHours[skill.name] || 0) + session.durationMins / 60;
      }
    }

    const skillDistribution = Object.entries(skillHours).map(([name, value]) => ({
      name,
      value: Math.round(value * 10) / 10,
    }));

    const failureRecords = await db.failureRecord.findMany({
      where: { userId, date: { gte: start, lte: end } },
    });
    const failureReasonCounts: Record<string, number> = {};
    for (const f of failureRecords) {
      failureReasonCounts[f.reason] = (failureReasonCounts[f.reason] || 0) + 1;
    }
    const failureReasons = Object.entries(failureReasonCounts).map(([reason, count]) => ({ reason, count }));

    const avgDiscipline = disciplineScores.length > 0
      ? disciplineScores.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / disciplineScores.length
      : 0;

    const totalLearningHours = learningSessions.reduce((sum: number, s: { durationMins: number }) => sum + s.durationMins, 0) / 60;
    const avgDailyLearning = totalLearningHours / days;

    const completedProjects = projects.filter((p) => p.phase === "COMPLETED").length;
    const activeProjects = projects.filter((p) => p.phase !== "COMPLETED").length;

    const prayerCompleted = prayerRecords.filter((p) => p.status === "COMPLETED").length;
    const prayerTotal = prayerRecords.length;

    const walkingCompleted = walkingRecords.filter((w) => w.completed).length;
    const exerciseCompleted = exerciseRecords.filter((e) => e.completed).length;

    const avgSleep = sleepRecords.length > 0
      ? sleepRecords.reduce((sum: number, s: { hours: number | null }) => sum + (s.hours || 0), 0) / sleepRecords.length
      : 0;

    return NextResponse.json({
      weeklyHours: Object.entries(dailyHours).map(([day, hours]) => ({ day, hours: Math.round(hours * 10) / 10 })),
      disciplineTrend,
      skillDistribution,
      failureReasons,
      summary: {
        totalLearningHours: Math.round(totalLearningHours * 10) / 10,
        avgDailyLearning: Math.round(avgDailyLearning * 10) / 10,
        avgDiscipline: Math.round(avgDiscipline * 10) / 10,
        completedProjects,
        activeProjects,
        prayerCompleted,
        prayerTotal,
        walkingCompleted,
        exerciseCompleted,
        avgSleep: Math.round(avgSleep * 10) / 10,
        totalDays: days,
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}