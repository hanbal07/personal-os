import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, prayer, status } = body;

  return NextResponse.json({
    success: true,
    record: {
      date,
      prayer,
      status,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  return NextResponse.json({
    date,
    prayers: [
      { name: "Fajr", status: "COMPLETED", time: "4:45 AM" },
      { name: "Dhuhr", status: "COMPLETED", time: "12:15 PM" },
      { name: "Asr", status: "PENDING", time: "3:45 PM" },
      { name: "Maghrib", status: "PENDING", time: "6:30 PM" },
      { name: "Isha", status: "PENDING", time: "8:00 PM" },
    ],
  });
}
