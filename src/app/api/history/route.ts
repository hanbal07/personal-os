import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserDateContext, getDbDate, addDays } from "@/lib/user-date-context";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const days = Math.min(parseInt(request.nextUrl.searchParams.get("days") || "30", 10) || 30, 365);
    const ctx = await getUserDateContext(userId);
    const start = getDbDate(addDays(ctx.dateStr, -(days - 1)));
    const end = ctx.date;

    const [scores, prayers, quran, darood, walking, exercise, learningSessions, reviews, sleeps, waters, meals, completions, habits, projects, weights] = await Promise.all([
      db.disciplineScore.findMany({ where: { userId, date: { gte: start, lte: end } }, orderBy: { date: "desc" } }),
      db.prayerRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.quranRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.daroodRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.walkingRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.exerciseRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.learningSession.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.dailyReview.findMany({ where: { userId, date: { gte: start, lte: end } }, orderBy: { date: "desc" } }),
      db.sleepRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.waterRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.mealRecord.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { date: true } }),
      db.habitCompletion.findMany({
        where: { habit: { userId }, date: { gte: start, lte: end } },
        select: { date: true, status: true },
      }),
      db.habit.findMany({ where: { userId, active: true }, select: { id: true, createdAt: true } }),
      db.project.findMany({ where: { userId, updatedAt: { gte: start, lte: end } }, select: { title: true, updatedAt: true } }),
      db.weightEntry.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { date: true, weightKg: true } }),
    ]);

    const byDate = new Map<string, Record<string, unknown>>();
    const rowFor = (k: string) => {
      let row = byDate.get(k);
      if (!row) {
        row = { date: k };
        byDate.set(k, row);
      }
      return row;
    };
    const dayKey = (d: Date) => d.toISOString().split("T")[0];

    for (const s of scores) {
      const k = dayKey(s.date);
      rowFor(k).disciplineScore = s.score;
    }
    for (const p of prayers) {
      const k = dayKey(p.date);
      const row = rowFor(k);
      row.prayersCompleted = ((row.prayersCompleted as number) || 0) + (p.status === "COMPLETED" ? 1 : 0);
    }
    for (const q of quran) {
      const k = dayKey(q.date);
      const row = rowFor(k);
      row.quran = q.status === "COMPLETED";
      row.pagesRead = q.pagesRead;
    }
    for (const dr of darood) {
      const k = dayKey(dr.date);
      rowFor(k).daroodCount = dr.count;
    }
    for (const w of walking) {
      const k = dayKey(w.date);
      const row = rowFor(k);
      row.walking = w.completed;
      row.steps = w.steps;
    }
    for (const e of exercise) {
      const k = dayKey(e.date);
      const row = rowFor(k);
      row.exerciseMins = ((row.exerciseMins as number) || 0) + (e.durationMins || 0);
    }
    for (const l of learningSessions) {
      const k = dayKey(l.date);
      const row = rowFor(k);
      row.learningMins = ((row.learningMins as number) || 0) + (l.durationMins || 0);
      const sessions = ((row.sessions as Array<{ mins: number; at: string }>) || []);
      sessions.push({ mins: l.durationMins || 0, at: l.createdAt.toISOString() });
      row.sessions = sessions;
    }
    for (const r of reviews) {
      const k = dayKey(r.date);
      const row = rowFor(k);
      row.dayScore = r.dayScore;
      row.notes = r.accomplishments;
      row.reviewed = true;
    }
    for (const s of sleeps) {
      const k = dayKey(s.date);
      const row = rowFor(k);
      row.sleepHours = s.hours;
      row.sleepQuality = s.quality;
    }
    for (const w of waters) {
      const k = dayKey(w.date);
      const row = rowFor(k);
      row.waterGlasses = w.glasses;
      row.waterTarget = w.target;
    }
    for (const m of meals) {
      const k = dayKey(m.date);
      const row = rowFor(k);
      row.mealsLogged = ((row.mealsLogged as number) || 0) + 1;
    }
    for (const c of completions) {
      const k = dayKey(c.date);
      const row = rowFor(k);
      if (c.status === "COMPLETED") row.habitsDone = ((row.habitsDone as number) || 0) + 1;
      else if (c.status === "MISSED" || c.status === "PARTIAL") row.habitsAttempted = ((row.habitsAttempted as number) || 0) + 1;
    }
    const plannedByDay = new Map<string, number>();
    for (const h of habits) {
      // count this habit as planned for every day from its creation to today within range
      let d = new Date(h.createdAt.toISOString().split("T")[0] + "T00:00:00Z");
      const last = new Date(end.toISOString().split("T")[0] + "T00:00:00Z");
      while (d <= last) {
        const k = d.toISOString().split("T")[0];
        plannedByDay.set(k, (plannedByDay.get(k) || 0) + 1);
        d = new Date(d.getTime() + 86400000);
      }
    }
    for (const [k, n] of plannedByDay) {
      if (byDate.has(k)) (byDate.get(k) as Record<string, unknown>).habitsPlanned = n;
    }
    for (const pr of projects) {
      const k = dayKey(pr.updatedAt);
      const row = rowFor(k);
      const touched = ((row.projectsTouched as string[]) || []);
      if (!touched.includes(pr.title)) touched.push(pr.title);
      row.projectsTouched = touched;
    }
    for (const w of weights) {
      const k = dayKey(w.date);
      rowFor(k).weightKg = w.weightKg;
    }

    const history = Array.from(byDate.values())
      .map((row) => ({ ...row, date: row.date as string }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return NextResponse.json({ days, count: history.length, history });
  } catch (error) {
    console.error("History GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
