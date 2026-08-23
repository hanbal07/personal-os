import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  return NextResponse.json({
    date: dateStr,
    greeting: getGreeting(),
    summary: {
      tasksCompleted: 3,
      tasksTotal: 8,
      disciplineScore: 78,
      streak: 5,
    },
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
