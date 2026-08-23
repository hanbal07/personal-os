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

    const [scores, prayers, quran, darood, walking, exercise, learningSessions, reviews] = await Promise.all([
      db.disciplineScore.findMany({ where: { userId, date: { gte: start, lte: end } }, orderBy: { date: "desc" } }),
      db.prayerRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.quranRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.daroodRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.walkingRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.exerciseRecord.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.learningSession.findMany({ where: { userId, date: { gte: start, lte: end } } }),
      db.dailyReview.findMany({ where: { userId, date: { gte: start, lte: end } }, orderBy: { date: "desc" } }),
    ]);

    const byDate = new Map<string, Record<string, unknown>>();
    const dayKey = (d: Date) => d.toISOString().split("T")[0];

    for (const s of scores) {
      const k = dayKey(s.date);
      const row = byDate.get(k) || { date: k };
      row.disciplineScore = s.score;
      byDate.set(k, row);
    }
    for (const p of prayers) {
      const k = dayKey(p.date);
      const row = byDate.get(k) || { date: k };
      row.prayersCompleted = ((row.prayersCompleted as number) || 0) + (p.status === "COMPLETED" ? 1 : 0);
      byDate.set(k, row);
    }
    for (const q of quran) {
      const k = dayKey(q.date);
      const row = byDate.get(k) || { date: k };
      row.quran = q.status === "COMPLETED";
      row.pagesRead = q.pagesRead;
      byDate.set(k, row);
    }
    for (const dr of darood) {
      const k = dayKey(dr.date);
      const row = byDate.get(k) || { date: k };
      row.daroodCount = dr.count;
      byDate.set(k, row);
    }
    for (const w of walking) {
      const k = dayKey(w.date);
      const row = byDate.get(k) || { date: k };
      row.walking = w.completed;
      row.steps = w.steps;
      byDate.set(k, row);
    }
    for (const e of exercise) {
      const k = dayKey(e.date);
      const row = byDate.get(k) || { date: k };
      row.exerciseMins = ((row.exerciseMins as number) || 0) + (e.durationMins || 0);
      byDate.set(k, row);
    }
    for (const l of learningSessions) {
      const k = dayKey(l.date);
      const row = byDate.get(k) || { date: k };
      row.learningMins = ((row.learningMins as number) || 0) + (l.durationMins || 0);
      byDate.set(k, row);
    }
    for (const r of reviews) {
      const k = dayKey(r.date);
      const row = byDate.get(k) || { date: k };
      row.dayScore = r.dayScore;
      row.notes = r.accomplishments;
      byDate.set(k, row);
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