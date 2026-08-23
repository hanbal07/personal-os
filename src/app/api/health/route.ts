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

    const [meals, walking, exercise, sleep, water] = await Promise.all([
      db.mealRecord.findMany({ where: { userId, date } }),
      db.walkingRecord.findUnique({ where: { userId_date: { userId, date } } }),
      db.exerciseRecord.findMany({ where: { userId, date } }),
      db.sleepRecord.findUnique({ where: { userId_date: { userId, date } } }),
      db.waterRecord.findUnique({ where: { userId_date: { userId, date } } }),
    ]);

    return NextResponse.json({
      date: date.toISOString().split("T")[0],
      meals,
      walking,
      exercise,
      sleep,
      water,
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
    let body: { type?: string; data?: Record<string, unknown> };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { type, data } = body;
    if (!type || typeof data !== "object" || data === null) {
      return NextResponse.json({ error: "type and data are required" }, { status: 400 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result;
    switch (type) {
      case "meal": {
        const VALID_MEALS = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];
        if (!VALID_MEALS.includes(String(data.mealType))) {
          return NextResponse.json({ error: `mealType must be one of: ${VALID_MEALS.join(", ")}` }, { status: 400 });
        }
        const content = typeof data.content === "string" && data.content.trim().length > 0 ? data.content.trim() : null;
        if (!content) {
          return NextResponse.json({ error: "content is required for a meal record" }, { status: 400 });
        }
        const waterGlasses = Number(data.water);
        const mealType = data.mealType as never;
        result = await db.mealRecord.upsert({
          where: { userId_date_mealType: { userId, date: today, mealType } },
          update: {
            content,
            water: Number.isInteger(waterGlasses) && waterGlasses >= 0 && waterGlasses <= 20 ? waterGlasses : null,
            notes: (data.notes as string) ?? null,
          },
          create: {
            userId,
            date: today,
            mealType,
            content,
            water: Number.isInteger(waterGlasses) && waterGlasses >= 0 && waterGlasses <= 20 ? waterGlasses : null,
            notes: (data.notes as string) ?? null,
          },
        });
        break;
      }
      case "walking": {
        const steps = Number(data.steps);
        const wmins = Number(data.durationMins);
        result = await db.walkingRecord.upsert({
          where: { userId_date: { userId, date: today } },
          update: {
            steps: Number.isInteger(steps) && steps >= 0 ? steps : null,
            durationMins: Number.isInteger(wmins) && wmins >= 0 && wmins <= 1440 ? wmins : null,
            completed: Boolean(data.completed),
            notes: (data.notes as string) ?? null,
          },
          create: {
            userId,
            date: today,
            steps: Number.isInteger(steps) && steps >= 0 ? steps : null,
            durationMins: Number.isInteger(wmins) && wmins >= 0 && wmins <= 1440 ? wmins : null,
            completed: Boolean(data.completed),
            notes: (data.notes as string) ?? null,
          },
        });
        break;
      }
      case "exercise": {
        const exmins = Number(data.durationMins);
        result = await db.exerciseRecord.create({
          data: {
            userId,
            date: today,
            type: String(data.type ?? "HOME_WORKOUT"),
            durationMins: Number.isInteger(exmins) && exmins > 0 && exmins <= 600 ? exmins : 30,
            completed: Boolean(data.completed),
            notes: (data.notes as string) ?? null,
          },
        });
        break;
      }
      case "water": {
        const glasses = Number(data.glasses);
        if (!Number.isInteger(glasses) || glasses < 0 || glasses > 50) {
          return NextResponse.json({ error: "glasses must be an integer between 0 and 50" }, { status: 400 });
        }
        result = await db.waterRecord.upsert({
          where: { userId_date: { userId, date: today } },
          update: { glasses, target: Number(data.target) || 8 },
          create: { userId, date: today, glasses, target: Number(data.target) || 8 },
        });
        break;
      }
      case "sleep": {
        const hours = Number(data.hours);
        const quality = Number(data.quality);
        const bed = typeof data.bedTime === "string" ? data.bedTime : null;
        const wake = typeof data.wakeTime === "string" ? data.wakeTime : null;
        result = await db.sleepRecord.upsert({
          where: { userId_date: { userId, date: today } },
          update: {
            bedTime: bed,
            wakeTime: wake,
            hours: Number.isFinite(hours) && hours > 0 && hours < 24 ? hours : null,
            quality: Number.isInteger(quality) && quality >= 1 && quality <= 5 ? quality : null,
            notes: typeof data.notes === "string" ? data.notes : null,
          },
          create: {
            userId,
            date: today,
            bedTime: bed,
            wakeTime: wake,
            hours: Number.isFinite(hours) && hours > 0 && hours < 24 ? hours : null,
            quality: Number.isInteger(quality) && quality >= 1 && quality <= 5 ? quality : null,
            notes: typeof data.notes === "string" ? data.notes : null,
          },
        });
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Health POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}