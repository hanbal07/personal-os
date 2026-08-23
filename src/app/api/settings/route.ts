import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    const str = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined);
    const num = (v: unknown, min: number, max: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
    };

    data.timezone = str(body.timezone);
    data.location = typeof body.location === "string" ? body.location.trim() : undefined;
    data.latitude = num(body.latitude, -90, 90);
    data.longitude = num(body.longitude, -180, 180);

    const VALID_METHODS = ["Karachi", "MWL", "ISNA", "Egypt", "Makkah", "Tehran", "Jafari"];
    if (typeof body.prayerCalcMethod === "string" && VALID_METHODS.includes(body.prayerCalcMethod)) {
      data.prayerCalcMethod = body.prayerCalcMethod;
    }
    const VALID_MADHABS = ["Hanafi", "Shafi"];
    if (typeof body.juristicMethod === "string" && VALID_MADHABS.includes(body.juristicMethod)) {
      data.juristicMethod = body.juristicMethod;
    }
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (typeof body.wakeTime === "string" && timeRe.test(body.wakeTime)) data.wakeTime = body.wakeTime;
    if (typeof body.sleepTime === "string" && timeRe.test(body.sleepTime)) data.sleepTime = body.sleepTime;

    data.dailyLearningHours = num(body.dailyLearningHours, 0, 24);
    data.walkingTargetMins = num(body.walkingTargetMins, 0, 600);
    data.workoutTargetMins = num(body.workoutTargetMins, 0, 600);
    if (typeof body.strictMode === "boolean") data.strictMode = body.strictMode;
    if (typeof body.notificationsOn === "boolean") data.notificationsOn = body.notificationsOn;

    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const settings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}