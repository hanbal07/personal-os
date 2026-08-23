import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, getTodayDate, calculatePercentage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { period = "week" } = await request.json();
    const days = period === "week" ? 7 : period === "month" ? 30 : 7;
    const { start } = getDateRange(days);
    const today = getTodayDate();

    const disciplineScores = await db.disciplineScore.findMany({
      where: { userId, date: { gte: start } },
    });

    if (disciplineScores.length < 3) {
      return NextResponse.json({
        error: "Not enough data yet. Complete at least 3 days to generate a meaningful analysis.",
        needsMoreData: true,
      }, { status: 400 });
    }

    const [
      learningSessions,
      projects,
      prayerRecords,
      walkingRecords,
      exerciseRecords,
      sleepRecords,
      habitCompletions,
      failureRecords,
      disciplineScoresAll,
    ] = await Promise.all([
      db.learningSession.findMany({ where: { userId, date: { gte: start } } }),
      db.project.findMany({ where: { userId } }),
      db.prayerRecord.findMany({ where: { userId, date: { gte: start } } }),
      db.walkingRecord.findMany({ where: { userId, date: { gte: start } } }),
      db.exerciseRecord.findMany({ where: { userId, date: { gte: start } } }),
      db.sleepRecord.findMany({ where: { userId, date: { gte: start } } }),
      db.habitCompletion.findMany({ where: { habit: { userId }, date: { gte: start } } }),
      db.failureRecord.findMany({ where: { userId, date: { gte: start } } }),
      db.disciplineScore.findMany({ where: { userId, date: { gte: start } }, orderBy: { date: "asc" } }),
    ]);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const patterns: string[] = [];
    const recommendations: string[] = [];

    const prayerCompleted = prayerRecords.filter((p) => p.status === "COMPLETED").length;
    const prayerTotal = prayerRecords.length;
    const prayerRate = prayerTotal > 0 ? calculatePercentage(prayerCompleted, prayerTotal) : 0;
    if (prayerRate >= 85) {
      strengths.push(`Prayer completion rate is strong at ${prayerRate}%`);
    } else if (prayerRate < 60) {
      weaknesses.push(`Prayer completion rate is ${prayerRate}% - aim for consistency`);
    }

    const walkingDone = walkingRecords.filter((w) => w.completed).length;
    const walkingTotal = walkingRecords.length;
    if (walkingTotal > 0 && walkingDone / walkingTotal >= 0.7) {
      strengths.push(`Walking habit maintained ${walkingDone} out of ${walkingTotal} days`);
    } else if (walkingTotal > 0 && walkingDone / walkingTotal < 0.5) {
      weaknesses.push(`Walking skipped ${walkingTotal - walkingDone} out of ${walkingTotal} days`);
    }

    const exerciseDone = exerciseRecords.filter((e) => e.completed).length;
    const exerciseTotal = exerciseRecords.length;
    if (exerciseTotal > 0 && exerciseDone / exerciseTotal >= 0.7) {
      strengths.push(`Workout consistency at ${calculatePercentage(exerciseDone, exerciseTotal)}%`);
    } else if (exerciseTotal > 0 && exerciseDone / exerciseTotal < 0.4) {
      weaknesses.push(`Workout skipped ${exerciseTotal - exerciseDone} out of ${exerciseTotal} days`);
    }

    const avgDiscipline = disciplineScoresAll.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / disciplineScoresAll.length;
    if (avgDiscipline >= 75) {
      strengths.push(`Average discipline score is ${Math.round(avgDiscipline)}%`);
    }

    const morningSessions = learningSessions.filter((s) => new Date(s.date).getHours() < 12);
    const eveningSessions = learningSessions.filter((s) => new Date(s.date).getHours() >= 17);
    if (eveningSessions.length > 0 && morningSessions.length > eveningSessions.length * 2) {
      patterns.push("Your completion rate is significantly higher in the morning");
    } else if (eveningSessions.length > morningSessions.length) {
      weaknesses.push("Evening learning sessions have lower completion rate");
    }

    const weekendScores = disciplineScoresAll.filter((s) => {
      const day = new Date(s.date).getDay();
      return day === 0 || day === 6;
    });
    const weekdayScores = disciplineScoresAll.filter((s) => {
      const day = new Date(s.date).getDay();
      return day !== 0 && day !== 6;
    });
    if (weekendScores.length > 0 && weekdayScores.length > 0) {
      const weekendAvg = weekendScores.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / weekendScores.length;
      const weekdayAvg = weekdayScores.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / weekdayScores.length;
      if (weekendAvg < weekdayAvg * 0.8) {
        patterns.push(`Weekend discipline is ${Math.round((1 - weekendAvg / weekdayAvg) * 100)}% lower than weekdays`);
      }
    }

    const failureCounts: Record<string, number> = {};
    for (const f of failureRecords) {
      failureCounts[f.reason] = (failureCounts[f.reason] || 0) + 1;
    }
    const topFailure = Object.entries(failureCounts).sort((a, b) => b[1] - a[1])[0];
    if (topFailure) {
      const [reason, count] = topFailure;
      patterns.push(`Most common obstacle: ${reason.replace(/_/g, " ")} (${count}x)`);
      if (reason === "PHONE_DISTRACTION" || reason === "SOCIAL_MEDIA") {
        recommendations.push("Set phone to Do Not Disturb during deep work sessions (2-5 PM)");
      } else if (reason === "TIREDNESS") {
        recommendations.push("Review sleep schedule - aim for 7-8 hours quality sleep");
      } else if (reason === "OVERSLEPT") {
        recommendations.push("Place alarm across the room and establish consistent bedtime routine");
      } else if (reason === "LAZINESS") {
        recommendations.push("Break tasks into 15-minute blocks to overcome initial resistance");
      }
    }

    const skillHours: Record<string, number> = {};
    for (const s of learningSessions) {
      const skill = await db.skill.findUnique({ where: { id: s.skillId } });
      if (skill) skillHours[skill.name] = (skillHours[skill.name] || 0) + s.durationMins / 60;
    }
    const sortedSkills = Object.entries(skillHours).sort((a, b) => b[1] - a[1]);
    if (sortedSkills.length > 1) {
      const neglected = sortedSkills.slice(-2).map(([name]) => name);
      if (neglected.some((n) => skillHours[n] < 1)) {
        weaknesses.push(`Skills needing attention: ${neglected.join(", ")}`);
      }
    }

    const completedProjects = projects.filter((p) => p.phase === "COMPLETED").length;
    if (completedProjects === 0 && projects.length > 0) {
      weaknesses.push(`${projects.length} projects started but none completed yet`);
      recommendations.push("Focus on completing one project before starting new ones");
    }

    if (sleepRecords.length > 0) {
      const avgSleep = sleepRecords.reduce((sum: number, s: { hours: number | null }) => sum + (s.hours || 0), 0) / sleepRecords.length;
      if (avgSleep < 6.5) {
        weaknesses.push(`Average sleep is ${avgSleep.toFixed(1)}h - below recommended 7-8h`);
        recommendations.push("Prioritize 9 PM bedtime to protect 8 hours of sleep");
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Keep up the good consistency - maintain current habits");
    }
    if (strengths.length > weaknesses.length) {
      recommendations.push("You're on the right track - focus on the few weak areas identified");
    }

    const summary = {
      disciplineScore: Math.round(avgDiscipline),
      learningHours: Math.round(learningSessions.reduce((sum: number, s: { durationMins: number }) => sum + s.durationMins, 0) / 60 * 10) / 10,
      tasksCompleted: habitCompletions.filter((h) => h.status === "COMPLETED").length,
      tasksMissed: habitCompletions.filter((h) => h.status === "MISSED").length,
    };

    await db.aIAnalysis.create({
      data: {
        userId,
        date: today,
        type: period,
        content: { summary, strengths, weaknesses, patterns, recommendations },
      },
    });

    return NextResponse.json({
      success: true,
      type: period,
      analysis: { summary, strengths, weaknesses, patterns, recommendations },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}