import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserDateContext } from "@/lib/user-date-context";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const dateStr = request.nextUrl.searchParams.get("date");
    let date: Date;
    try {
      ({ date } = await getUserDateContext(userId, dateStr));
    } catch {
      return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
    }

    const prayers = await db.prayerRecord.findMany({
      where: { userId, date },
    });

    return NextResponse.json({
      date: date.toISOString().split("T")[0],
      prayers,
    });
  } catch (error) {
    console.error("Prayers GET error:", error);
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
    let body: { date?: unknown; prayer?: unknown; status?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { date, prayer, status } = body;

    const VALID_PRAYERS = ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];
    const VALID_STATUSES = ["COMPLETED", "PARTIAL", "MISSED"];
    if (typeof date !== "string" || isNaN(new Date(`${date}T12:00:00`).getTime())) {
      return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
    }
    if (!VALID_PRAYERS.includes(prayer as string)) {
      return NextResponse.json({ error: `prayer must be one of: ${VALID_PRAYERS.join(", ")}` }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status as string)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const record = await db.prayerRecord.upsert({
      where: { userId_date_prayer: { userId, date: new Date(`${date}T12:00:00`), prayer: prayer as never } },
      update: { status: status as never, updatedAt: new Date() },
      create: { userId, date: new Date(`${date}T12:00:00`), prayer: prayer as never, status: status as never },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Prayers POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}