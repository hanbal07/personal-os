import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodayDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = getTodayDate();

    const routine = await db.dailyRoutine.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!routine) {
      return NextResponse.json({ routine: null, tasks: [] });
    }

    const habits = await db.habit.findMany({
      where: { userId, active: true },
      orderBy: { sortOrder: "asc" },
    });

    const habitCompletions = await db.habitCompletion.findMany({
      where: { habit: { userId }, date: today },
    });

    const tasks = habits.map((habit) => {
      const completion = habitCompletions.find((h) => h.habitId === habit.id);
      return {
        id: habit.id,
        label: habit.name,
        category: habit.category || "routine",
        completed: completion?.status === "COMPLETED",
        notes: completion?.notes || "",
      };
    });

    return NextResponse.json({ routine, tasks });
  } catch (error) {
    console.error("Routine GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = getTodayDate();
    const body = await request.json();
    const { tasks, wakeTime, notes } = body;

    const routine = await db.dailyRoutine.upsert({
      where: { userId_date: { userId, date: today } },
      update: { wakeTime, notes, updatedAt: new Date() },
      create: { userId, date: today, wakeTime, notes, wakeUp: true },
    });

    if (tasks && Array.isArray(tasks)) {
      for (const task of tasks) {
        await db.habitCompletion.upsert({
          where: { habitId_date: { habitId: task.id, date: today } },
          update: {
            status: task.completed ? "COMPLETED" : task.completed === false ? "MISSED" : "PARTIAL",
            notes: task.notes || "",
          },
          create: {
            habitId: task.id,
            date: today,
            status: task.completed ? "COMPLETED" : "MISSED",
            notes: task.notes || "",
          },
        });
      }
    }

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error("Routine POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}