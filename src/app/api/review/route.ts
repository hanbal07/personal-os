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

    const review = await db.dailyReview.findUnique({
      where: { userId_date: { userId, date } },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Review GET error:", error);
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
    let body: { date?: unknown; accomplishments?: unknown; failures?: unknown; reasons?: unknown; learned?: unknown; distractions?: unknown; tomorrowPlan?: unknown; dayScore?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { date, accomplishments, failures, reasons, learned, distractions, tomorrowPlan, dayScore } = body;

    if (typeof date !== "string" || isNaN(new Date(`${date}T12:00:00`).getTime())) {
      return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
    }
    let score: number | null = null;
    if (dayScore !== undefined && dayScore !== null) {
      score = Number(dayScore);
      if (!Number.isInteger(score) || score < 1 || score > 10) {
        return NextResponse.json({ error: "dayScore must be an integer between 1 and 10" }, { status: 400 });
      }
    }
    const parsedDate = new Date(`${date}T12:00:00`);

    const str = (v: unknown) => (typeof v === "string" ? v : null);

    const review = await db.dailyReview.upsert({
      where: { userId_date: { userId, date: parsedDate } },
      update: {
        accomplishments: str(accomplishments),
        failures: str(failures),
        reasons: str(reasons),
        learned: str(learned),
        distractions: str(distractions),
        tomorrowPlan: str(tomorrowPlan),
        dayScore: score,
        updatedAt: new Date(),
      },
      create: {
        userId,
        date: parsedDate,
        accomplishments: str(accomplishments),
        failures: str(failures),
        reasons: str(reasons),
        learned: str(learned),
        distractions: str(distractions),
        tomorrowPlan: str(tomorrowPlan),
        dayScore: score,
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}