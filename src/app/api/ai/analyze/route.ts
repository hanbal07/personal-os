import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, data } = body;

  const analysisTemplates: Record<string, any> = {
    weekly: {
      summary: {
        disciplineScore: 73,
        learningHours: 49.1,
        tasksCompleted: 34,
        tasksMissed: 12,
      },
      strengths: [
        "Morning routine consistency is strong at 85%",
        "Prayer completion rate improved to 90%",
        "Walking habit maintained 6 out of 7 days",
      ],
      weaknesses: [
        "Evening learning sessions missed 5 times this week",
        "Workout skipped on 2 consecutive days",
        "Phone distraction peaked during afternoon hours",
      ],
      patterns: [
        "Your completion rate drops significantly after 3 PM",
        "Weekend discipline is 25% lower than weekdays",
        "Tasks assigned to morning have 2x higher completion rate",
      ],
      recommendations: [
        "Move difficult learning tasks to morning (before noon)",
        "Set phone to Do Not Disturb from 2-5 PM",
        "Schedule workouts right after Fajr when energy is highest",
        "Consider lighter schedule on weekends to maintain consistency",
      ],
    },
  };

  const result = analysisTemplates[type] || analysisTemplates.weekly;

  return NextResponse.json({
    success: true,
    type,
    analysis: result,
    generatedAt: new Date().toISOString(),
  });
}
