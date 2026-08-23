import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.upsert({
    where: { email: "user@personalos.dev" },
    update: {},
    create: {
      email: "user@personalos.dev",
      name: "User",
      settings: {
        create: {
          timezone: "Asia/Karachi",
          location: "Lahore, Pakistan",
          latitude: 31.5204,
          longitude: 74.3587,
          prayerCalcMethod: "Karachi",
          juristicMethod: "Hanafi",
          wakeTime: "05:00",
          sleepTime: "21:00",
          dailyLearningHours: 8,
          walkingTargetMins: 30,
          workoutTargetMins: 45,
          strictMode: true,
        },
      },
    },
  });

  console.log("Created user:", user.id);

  const skills = [
    { name: "Python", slug: "python", sortOrder: 1, topicsTotal: 20 },
    { name: "Git/GitHub", slug: "git", sortOrder: 2, topicsTotal: 15 },
    { name: "Data Science", slug: "data-science", sortOrder: 3, topicsTotal: 18 },
    { name: "Web Development", slug: "web-dev", sortOrder: 4, topicsTotal: 25 },
    { name: "Machine Learning", slug: "ml", sortOrder: 5, topicsTotal: 22 },
    { name: "Deep Learning", slug: "dl", sortOrder: 6, topicsTotal: 20 },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { userId_slug: { userId: user.id, slug: skill.slug } },
      update: {},
      create: {
        userId: user.id,
        ...skill,
      },
    });
  }

  console.log("Created skills");

  const pythonTopics = [
    "Syntax & Variables",
    "Data Types",
    "Conditions",
    "Loops",
    "Functions",
    "Data Structures",
    "File Handling",
    "Exceptions",
    "Modules",
    "OOP",
    "Packages",
    "Virtual Environments",
    "APIs",
    "Testing",
    "Clean Code",
  ];

  const pythonSkill = await prisma.skill.findFirst({
    where: { userId: user.id, slug: "python" },
  });

  if (pythonSkill) {
    for (let i = 0; i < pythonTopics.length; i++) {
      await prisma.topic.create({
        data: {
          skillId: pythonSkill.id,
          title: pythonTopics[i],
          order: i + 1,
          phase: "FUNDAMENTALS",
          status: i < 4 ? "COMPLETED" : i === 4 ? "IN_PROGRESS" : "NOT_STARTED",
        },
      });
    }
    console.log("Created Python topics");
  }

  const habits = [
    { name: "Wake up at 5:00 AM", category: "routine" },
    { name: "Fajr on time", category: "islamic" },
    { name: "Read Quran", category: "islamic" },
    { name: "Morning walk", category: "health" },
    { name: "Deep work 2+ hours", category: "productivity" },
    { name: "No phone during work", category: "discipline" },
    { name: "Darood-e-Pak", category: "islamic" },
    { name: "Sleep by 9 PM", category: "routine" },
  ];

  for (let i = 0; i < habits.length; i++) {
    await prisma.habit.create({
      data: {
        userId: user.id,
        name: habits[i].name,
        category: habits[i].category,
        sortOrder: i + 1,
      },
    });
  }

  console.log("Created habits");
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
