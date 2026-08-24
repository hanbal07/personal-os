import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserDateContext, isValidDateString } from "@/lib/user-date-context";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [entries, settings] = await Promise.all([
      db.weightEntry.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 365 }),
      db.userSettings.findUnique({ where: { userId } }),
    ]);

    return NextResponse.json({
      entries: entries.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        weightKg: e.weightKg,
        note: e.note,
      })),
      startWeightKg: settings?.startWeightKg ?? null,
      goalWeightKg: settings?.goalWeightKg ?? null,
    });
  } catch (error) {
    console.error("Weight GET error:", error);
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

    let body: { weightKg?: unknown; date?: unknown; note?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const weightKg = Number(body.weightKg);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
      return NextResponse.json(
        { error: "weightKg must be a number between 20 and 400" },
        { status: 400 }
      );
    }

    const dateStr = typeof body.date === "string" ? body.date : null;
    let date: Date;
    try {
      if (dateStr !== null && !isValidDateString(dateStr)) throw new Error("INVALID_DATE");
      ({ date } = await getUserDateContext(userId, dateStr));
    } catch {
      return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
    }

    const note = typeof body.note === "string" && body.note.trim().length > 0 ? body.note.trim() : null;

    const entry = await db.weightEntry.upsert({
      where: { userId_date: { userId, date } },
      update: { weightKg, note },
      create: { userId, date, weightKg, note },
    });

    const settings = await db.userSettings.findUnique({ where: { userId } });
    let startWeightKg = settings?.startWeightKg ?? null;
    if (startWeightKg === null) {
      const updated = await db.userSettings.update({
        where: { userId },
        data: { startWeightKg: weightKg },
      });
      startWeightKg = updated.startWeightKg;
    }

    return NextResponse.json({
      entry: {
        date: entry.date.toISOString().split("T")[0],
        weightKg: entry.weightKg,
        note: entry.note,
      },
      startWeightKg,
      goalWeightKg: settings?.goalWeightKg ?? null,
    });
  } catch (error) {
    console.error("Weight POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
