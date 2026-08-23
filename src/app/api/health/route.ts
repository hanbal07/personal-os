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

    const [meals, walking, exercise, sleep] = await Promise.all([
      db.mealRecord.findMany({ where: { userId, date } }),
      db.walkingRecord.findUnique({ where: { userId_date: { userId, date } } }),
      db.exerciseRecord.findMany({ where: { userId, date } }),
      db.sleepRecord.findUnique({ where: { userId_date: { userId, date } } }),
    ]);

    return NextResponse.json({
      date: date.toISOString().split("T")[0],
      meals,
      walking,
      exercise,
      sleep,
    });
  } catch (error) {
    console.error("Health GET error:", error);
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
    const { type, data } = body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result;
    switch (type) {
      case "meal":
        result = await db.mealRecord.upsert({
          where: { userId_date_mealType: { userId, date: today, mealType: data.mealType } },
          update: { content: data.content, water: data.water, notes: data.notes },
          create: { userId, date: today, mealType: data.mealType, content: data.content, water: data.water, notes: data.notes },
        });
        break;
      case "walking":
        result = await db.walkingRecord.upsert({
          where: { userId_date: { userId, date: today } },
          update: { steps: data.steps, durationMins: data.durationMins, completed: data.completed, notes: data.notes },
          create: { userId, date: today, steps: data.steps, durationMins: data.durationMins, completed: data.completed, notes: data.notes },
        });
        break;
      case "exercise":
        await db.exerciseRecord.deleteMany({ where: { userId, date: today, type: data.type } });
        result = await db.exerciseRecord.create({
          data: { userId, date: today, type: data.type, durationMins: data.durationMins, completed: data.completed, notes: data.notes },
        });
        break;
      case "sleep":
        result = await db.sleepRecord.upsert({
          where: { userId_date: { userId, date: today } },
          update: { bedTime: data.bedTime, wakeTime: data.wakeTime, hours: data.hours, quality: data.quality, notes: data.notes },
          create: { userId, date: today, bedTime: data.bedTime, wakeTime: data.wakeTime, hours: data.hours, quality: data.quality, notes: data.notes },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Health POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}