import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrayerTimesForDate, getNextPrayer, LocationConfig } from "@/lib/prayer-times";
import { getTodayDate } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const sorted = dates
    .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
    .sort((a, b) => b - a);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  if (sorted[0] !== todayTime) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i - 1] - sorted[i]) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
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
    const today = getTodayDate();
    const todayStr = today.toISOString().split("T")[0];

    const settings = await db.userSettings.findUnique({
      where: { userId },
    });

    const locationConfig: LocationConfig = {
      latitude: settings?.latitude ?? 31.5204,
      longitude: settings?.longitude ?? 74.3587,
      method: settings?.prayerCalcMethod ?? "Karachi",
      madhab: settings?.juristicMethod ?? "Hanafi",
    };

    const [
      routine,
      prayers,
      quran,
      darood,
      meals,
      exercise,
      walking,
      sleep,
      learningSessions,
      projects,
      habits,
      disciplineScore,
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
    ]);

    const prayerTimes = getPrayerTimesForDate(new Date(), locationConfig).filter((p) => p.name !== "Sunrise");
    const nextPrayer = getNextPrayer(locationConfig);

    const prayerCompleted = prayers.filter((p) => p.status === "COMPLETED").length;
    const quranCompleted = quran?.status === "COMPLETED";
    const daroodCount = darood?.count ?? 0;
    const daroodTarget = 33;

    const mealsCount = meals.length;
    const walkingCompleted = walking?.completed ?? false;
    const exerciseCompleted = exercise.filter((e) => e.completed).length;
    const exerciseTotal = exercise.length;

    const learningHours = learningSessions.reduce((sum: number, s: { durationMins: number }) => sum + s.durationMins, 0) / 60;
    const activeProjects = projects.length;

    const habitCompletions = await db.habitCompletion.findMany({
      where: { habit: { userId }, date: new Date(today) },
    });
    const habitsCompleted = habitCompletions.filter((h) => h.status === "COMPLETED").length;
    const habitsTotal = habits.length;

    const currentDisciplineScore = disciplineScore?.score ?? 0;

    const pastScores = await db.disciplineScore.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 30,
    });
    const streak = calculateStreak(pastScores.map((s) => s.date));

    return NextResponse.json({
      date: today.toISOString().split("T")[0],
      greeting: getGreeting(),
      summary: {
        tasksCompleted: habitCompletions.filter((h) => h.status === "COMPLETED").length,
        tasksTotal: habits.length,
        disciplineScore: disciplineScore?.score ?? 0,
        streak: calculateStreak(
          (await db.disciplineScore.findMany({
            where: { userId },
            orderBy: { date: "desc" },
            take: 30,
          })).map((s) => s.date)
        ),
      },
      prayers: {
        times: getPrayerTimesForDate(new Date(), locationConfig).filter((p) => p.name !== "Sunrise"),
        nextPrayer: getNextPrayer(locationConfig),
        completed: prayers.filter((p) => p.status === "COMPLETED").length,
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
        water: 0,
      },
      learning: {
        hours: Math.round(learningSessions.reduce((sum: number, s: { durationMins: number }) => sum + s.durationMins, 0) / 60 * 10) / 10,
        targetHours: settings?.dailyLearningHours ?? 8,
        sessions: learningSessions.length,
      },
      projects: {
        active: projects.filter((p) => p.phase !== "COMPLETED").length,
        records: projects,
      },
      habits: {
        completed: (await db.habitCompletion.findMany({
          where: { habit: { userId }, date: new Date() },
        })).filter((h) => h.status === "COMPLETED").length,
        total: habits.length,
      },
      sleep: {
        hours: (await db.sleepRecord.findUnique({ where: { userId_date: { userId, date: new Date() } } }))?.hours ?? 0,
        target: 8,
        bedTime: (await db.sleepRecord.findUnique({ where: { userId_date: { userId, date: new Date() } } }))?.bedTime,
        wakeTime: (await db.sleepRecord.findUnique({ where: { userId_date: { userId, date: new Date() } } }))?.wakeTime,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}