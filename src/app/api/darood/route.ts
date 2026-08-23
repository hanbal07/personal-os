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

    const dateStr = request.nextUrl.searchParams.get("date");
    const ctx = await getUserDateContext(session.user.id, dateStr);
    const today = ctx.date;

    const record = await db.daroodRecord.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Darood GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { increment?: unknown; count?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { date: today } = await getUserDateContext(session.user.id);

    let record;
    if (body.increment !== undefined) {
      const inc = Number(body.increment);
      if (!Number.isInteger(inc) || inc < -100 || inc > 100 || inc === 0) {
        return NextResponse.json({ error: "increment must be a non-zero integer between -100 and 100" }, { status: 400 });
      }
      const existing = await db.daroodRecord.findUnique({
        where: { userId_date: { userId: session.user.id, date: today } },
      });
      const next = Math.max(0, Math.min(9999, (existing?.count ?? 0) + inc));
      record = await db.daroodRecord.upsert({
        where: { userId_date: { userId: session.user.id, date: today } },
        update: { count: next, status: next >= 33 ? "COMPLETED" : next > 0 ? "PARTIAL" : "MISSED" },
        create: { userId: session.user.id, date: today, count: next, status: next >= 33 ? "COMPLETED" : next > 0 ? "PARTIAL" : "MISSED" },
      });
    } else {
      const count = Number(body.count);
      if (!Number.isInteger(count) || count < 0 || count > 9999) {
        return NextResponse.json({ error: "count must be an integer between 0 and 9999" }, { status: 400 });
      }
      record = await db.daroodRecord.upsert({
        where: { userId_date: { userId: session.user.id, date: today } },
        update: { count, status: count >= 33 ? "COMPLETED" : count > 0 ? "PARTIAL" : "MISSED" },
        create: { userId: session.user.id, date: today, count, status: count >= 33 ? "COMPLETED" : count > 0 ? "PARTIAL" : "MISSED" },
      });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Darood POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}