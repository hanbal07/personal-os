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
    const body = await request.json();
    const { date, accomplishments, failures, reasons, learned, distractions, tomorrowPlan, dayScore } = body;

    const review = await db.dailyReview.upsert({
      where: { userId_date: { userId, date: new Date(date) } },
      update: {
        accomplishments,
        failures,
        reasons,
        learned,
        distractions,
        tomorrowPlan,
        dayScore,
        updatedAt: new Date(),
      },
      create: {
        userId,
        date: new Date(date),
        accomplishments,
        failures,
        reasons,
        learned,
        distractions,
        tomorrowPlan,
        dayScore,
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}