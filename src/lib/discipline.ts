export interface DisciplineBreakdown {
  wakeUp: number;
  namaz: number;
  quran: number;
  darood: number;
  exercise: number;
  walking: number;
  meals: number;
  deepWork: number;
  learning: number;
  projectWork: number;
  phoneControl: number;
  sleep: number;
}

export function calculateDisciplineScore(breakdown: DisciplineBreakdown): number {
  const weights: Record<keyof DisciplineBreakdown, number> = {
    wakeUp: 10,
    namaz: 15,
    quran: 10,
    darood: 5,
    exercise: 10,
    walking: 5,
    meals: 10,
    deepWork: 15,
    learning: 10,
    projectWork: 5,
    phoneControl: 3,
    sleep: 2,
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const value = breakdown[key as keyof DisciplineBreakdown];
    totalScore += (value / 100) * weight;
    totalWeight += weight;
  }

  return Math.round((totalScore / totalWeight) * 100);
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Needs Improvement";
  return "Critical";
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function analyzePatterns(
  records: { date: Date; task: string; status: string }[]
): string[] {
  const patterns: string[] = [];
  const taskCounts: Record<string, { completed: number; missed: number }> = {};

  for (const record of records) {
    if (!taskCounts[record.task]) {
      taskCounts[record.task] = { completed: 0, missed: 0 };
    }
    if (record.status === "COMPLETED") {
      taskCounts[record.task].completed++;
    } else if (record.status === "MISSED") {
      taskCounts[record.task].missed++;
    }
  }

  for (const [task, counts] of Object.entries(taskCounts)) {
    const total = counts.completed + counts.missed;
    if (total >= 3) {
      const completionRate = counts.completed / total;
      if (completionRate < 0.5) {
        patterns.push(
          `You have missed ${counts.missed} out of ${total} ${task} sessions. Your completion rate is ${Math.round(completionRate * 100)}%.`
        );
      }
    }
  }

  return patterns;
}

export function getFailureInsights(
  failures: { task: string; reason: string; date: Date }[]
): Record<string, number> {
  const reasonCounts: Record<string, number> = {};

  for (const failure of failures) {
    if (!reasonCounts[failure.reason]) {
      reasonCounts[failure.reason] = 0;
    }
    reasonCounts[failure.reason]++;
  }

  return reasonCounts;
}

export function recommendScheduleChanges(
  patterns: string[],
  insights: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  const topReason = Object.entries(insights).sort((a, b) => b[1] - a[1])[0];

  if (topReason) {
    if (topReason[0] === "PHONE_DISTRACTION" || topReason[0] === "SOCIAL_MEDIA") {
      recommendations.push(
        "Your biggest obstacle is phone distraction. Consider using app blockers during deep work sessions and keeping your phone in another room."
      );
    }
    if (topReason[0] === "TIREDNESS") {
      recommendations.push(
        "Tiredness is affecting your consistency. Review your sleep schedule and ensure you are getting 7-8 hours of quality sleep."
      );
    }
    if (topReason[0] === "OVERSLEPT") {
      recommendations.push(
        "You are oversleeping frequently. Place your alarm across the room and establish a consistent bedtime routine."
      );
    }
    if (topReason[0] === "LAZINESS") {
      recommendations.push(
        "Laziness is a recurring pattern. Break tasks into smaller 15-minute blocks to overcome initial resistance."
      );
    }
  }

  if (patterns.length > 2) {
    recommendations.push(
      "You have multiple tasks with low completion rates. Focus on completing just 2-3 core tasks consistently before adding more."
    );
  }

  return recommendations;
}
