import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, tasks } = body;

  return NextResponse.json({
    success: true,
    message: "Routine saved",
    date,
    completedCount: tasks?.filter((t: any) => t.completed).length || 0,
  });
}
