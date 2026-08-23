import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrayerTimesForDate, getNextPrayer, LocationConfig } from "@/lib/prayer-times";
import { getUserDateContext, getDbDate, getUserLocalHour } from "@/lib/user-date-context";

function calculateStreak(dates: Date[], todayStr: string): number {
  if (dates.length === 0) return 0;
  const dayNumber = (d: Date) => Math.floor(d.getTime() / 86400000);
  const sorted = dates.map(dayNumber).sort((a, b) => b - a);
  const todayNum = dayNumber(getDbDate(todayStr));

  if (sorted[0] !== todayNum) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] - sorted[i] === 1) streak++;
    else break;
  }
  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // User-timezone-aware "today" (also loads settings in one query).
    const settings = await db.userSettings.findUnique({ where: { userId } });
    const requestedDate = request.nextUrl.searchParams.get("date");
    let todayStr: string;
    let today: Date;
    let timezone: string;
    try {
      const ctx = await getUserDateContext(userId, requestedDate);
      todayStr = ctx.dateStr;
      today = ctx.date;
      timezone = ctx.timezone;
    } catch {
      return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
    }

    const locationConfig: LocationConfig = {
      latitude: settings?.latitude ?? 31.5204,
      longitude: settings?.longitude ?? 74.3587,
      method: settings?.prayerCalcMethod ?? "Karachi",
      madhab: settings?.juristicMethod ?? "Hanafi",
    };

    // Single parallel batch â€” every record needed below is fetched exactly once.
    const [
      routine,
      prayers,
      quran,
      darood,
      meals,
      exercise,
      walking,
      sleepRecord,
      learningSessions,
      projects,
      habits,
      disciplineScore,
      waterRecord,
      habitCompletions,
      pastScores,
    ] = await Promise.all([
      db.dailyRoutine.findUnique({ where: { userId_date: { userId, date: today } } }),
      db.prayerRecord.findMany({ where: { userId, date: today } }),
      db.quranRecord.findUnique({ where: { userId_date: { userId, date: today } } }),
      db.daroodRecord.findUnique({ where: { userId_date: { userId, date: today } } }),
      db.mealRecord.findMany({ where: { userId, date: today } }),
      db.exerciseRecord.findMany({ where: { userId, date: today } }),
      db.walkingRecord.findUnique({ where: { userId_date: { userId, date: today } } }),
      db.sleepRecord.findUnique({ where: { userId_date: { userId, date: today } } }),
      db.learningSession.findMany({ where: { userId, date: today } }),
      db.project.findMany({ where: { userId, phase: { not: "COMPLETED" } }, take: 5 }),
      db.habit.findMany({ where: { userId, active: true } }),
      db.disciplineScore.findUnique({ where: { userId_date: { userId, date: today } } }),
      db.waterRecord.findUnique({ where: { userId_date: { userId, date: today } } }),
      db.habitCompletion.findMany({ where: { habit: { userId }, date: today }, select: { status: true } }),
      db.disciplineScore.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 30,
        select: { date: true },
      }),
    ]);

    const now = new Date();
    const hour = getUserLocalHour(timezone, now);
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

    const prayerTimes = getPrayerTimesForDate(now, locationConfig).filter((p) => p.name !== "Sunrise");
    const nextPrayer = getNextPrayer(locationConfig);

    const prayerCompleted = prayers.filter((p) => p.status === "COMPLETED").length;
    const habitsCompleted = habitCompletions.filter((h) => h.status === "COMPLETED").length;
    const learningHours =
      Math.round(
        (learningSessions.reduce((sum: number, s: { durationMins: number }) => sum + s.durationMins, 0) / 60) * 10
      ) / 10;
    const streak = calculateStreak(pastScores.map((s) => s.date), todayStr);

    return NextResponse.json({
      date: todayStr,
      greeting,
      isNewUser:
        prayers.length === 0 &&
        !quran &&
        meals.length === 0 &&
        learningSessions.length === 0 &&
        !walking &&
        !sleepRecord &&
        habitsCompleted === 0 &&
        !disciplineScore,
      summary: {
        tasksCompleted: habitsCompleted,
        tasksTotal: habits.length,
        disciplineScore: disciplineScore?.score ?? 0,
        streak,
      },
      prayers: {
        times: prayerTimes,
        nextPrayer,
        completed: prayerCompleted,
        total: 5,
      },
      quran: {
        completed: quran?.status === "COMPLETED",
        pagesRead: quran?.pagesRead ?? 0,
      },
      darood: {
        count: darood?.count ?? 0,
        target: 33,
      },
      meals: {
        count: meals.length,
        target: 4,
        records: meals,
      },
      health: {
        walking: { completed: walking?.completed ?? false, targetMins: settings?.walkingTargetMins ?? 30 },
        exercise: { completed: exercise.filter((e) => e.completed).length, total: exercise.length, targetMins: settings?.workoutTargetMins ?? 45 },
        water: waterRecord?.glasses ?? 0,
        waterTarget: waterRecord?.target ?? 8,
      },
      learning: {
        hours: learningHours,
        targetHours: settings?.dailyLearningHours ?? 8,
        sessions: learningSessions.length,
      },
      projects: {
        active: projects.filter((p) => p.phase !== "COMPLETED").length,
        records: projects,
      },
      habits: {
        completed: habitsCompleted,
        total: habits.length,
      },
      sleep: {
        hours: sleepRecord?.hours ?? 0,
        target: 8,
        bedTime: sleepRecord?.bedTime,
        wakeTime: sleepRecord?.wakeTime,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}