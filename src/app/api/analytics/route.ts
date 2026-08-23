import { NextResponse } from "next/server";

export async function GET() {
  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split("T")[0],
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
      disciplineScore: Math.floor(Math.random() * 40) + 55,
      learningHours: Math.floor(Math.random() * 5) + 4,
      tasksCompleted: Math.floor(Math.random() * 4) + 5,
      tasksTotal: 8,
      prayers: Math.floor(Math.random() * 2) + 4,
      workout: Math.random() > 0.3,
      walking: Math.random() > 0.2,
    };
  });

  return NextResponse.json({ weekData });
}
