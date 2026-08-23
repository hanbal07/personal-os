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
    const body = await request.json();
    const { date, prayer, status } = body;

    const record = await db.prayerRecord.upsert({
      where: { userId_date_prayer: { userId, date: new Date(date), prayer } },
      update: { status, updatedAt: new Date() },
      create: { userId, date: new Date(date), prayer, status },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Prayers POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}