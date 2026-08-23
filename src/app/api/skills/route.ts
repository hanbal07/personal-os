import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const skills = [
    {
      name: "Python",
      slug: "python",
      phase: "FUNDAMENTALS",
      level: "BEGINNER",
      topicsCompleted: 7,
      topicsTotal: 20,
      practiceHours: 12,
      projectCount: 1,
      completion: 35,
      lastStudied: new Date().toISOString(),
      currentTopic: "Functions",
      nextTopic: "Data Structures",
    },
    {
      name: "Git/GitHub",
      slug: "git",
      phase: "FUNDAMENTALS",
      level: "BEGINNER",
      topicsCompleted: 3,
      topicsTotal: 15,
      practiceHours: 4,
      projectCount: 0,
      completion: 20,
      lastStudied: new Date(Date.now() - 86400000).toISOString(),
      currentTopic: "Commits & Branches",
      nextTopic: "Merge & PRs",
    },
  ];

  return NextResponse.json({ skills });
}
