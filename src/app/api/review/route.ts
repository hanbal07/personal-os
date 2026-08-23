import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, accomplished, failures, reasons, learned, distractions, tomorrowPlan, score } = body;

  return NextResponse.json({
    success: true,
    review: {
      date: date || new Date().toISOString().split("T")[0],
      accomplished,
      failures,
      reasons,
      learned,
      distractions,
      tomorrowPlan,
      score,
      createdAt: new Date().toISOString(),
    },
  });
}
