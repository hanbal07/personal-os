import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["COMPLETED", "PARTIAL", "MISSED"];

import { getUserDateContext } from "@/lib/user-date-context";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateStr = request.nextUrl.searchParams.get("date");
    let today: Date;
    try {
      today = (await getUserDateContext(session.user.id, dateStr)).date;
    } catch {
      return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
    }

    const record = await db.quranRecord.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Quran GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { date: today } = await getUserDateContext(session.user.id);

    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (typeof body.status !== "string" || !VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` }, { status: 400 });
      }
      data.status = body.status;
    }

    if (body.pagesRead !== undefined && body.pagesRead !== null && body.pagesRead !== "") {
      const pages = Number(body.pagesRead);
      if (!Number.isInteger(pages) || pages < 0 || pages > 604) {
        return NextResponse.json({ error: "pagesRead must be an integer between 0 and 604" }, { status: 400 });
      }
      data.pagesRead = pages;
    }

    if (body.durationMins !== undefined && body.durationMins !== null && body.durationMins !== "") {
      const mins = Number(body.durationMins);
      if (!Number.isInteger(mins) || mins < 1 || mins > 600) {
        return NextResponse.json({ error: "durationMins must be an integer between 1 and 600" }, { status: 400 });
      }
      data.durationMins = mins;
    }

    if (typeof body.notes === "string") {
      data.notes = body.notes.slice(0, 500);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to save" }, { status: 400 });
    }

    if (!data.status) {
      const existing = await db.quranRecord.findUnique({
        where: { userId_date: { userId: session.user.id, date: today } },
      });
      const pages = typeof data.pagesRead === "number" ? data.pagesRead : (existing?.pagesRead ?? null);
      data.status = !pages || pages <= 0 ? "PARTIAL" : pages >= 5 ? "COMPLETED" : "PARTIAL";
    }

    const record = await db.quranRecord.upsert({
      where: { userId_date: { userId: session.user.id, date: today } },
      update: data,
      create: { userId: session.user.id, date: today, ...data },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Quran POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}