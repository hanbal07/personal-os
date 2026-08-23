import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const projects = [
    {
      id: "1",
      title: "Python Calculator",
      phase: "COMPLETED",
      completion: 100,
      skills: ["Python", "Functions"],
      tasksTotal: 4,
      tasksCompleted: 4,
    },
    {
      id: "2",
      title: "Todo CLI App",
      phase: "DEVELOPMENT",
      completion: 40,
      skills: ["Python", "File Handling"],
      tasksTotal: 5,
      tasksCompleted: 2,
    },
  ];

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    project: {
      id: Date.now().toString(),
      ...body,
      phase: "IDEA",
      completion: 0,
      createdAt: new Date().toISOString(),
    },
  });
}
