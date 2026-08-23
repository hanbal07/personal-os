/**
 * Deletes a quranRecord for a user+date. Used by tz-e2e.ps1 to remove test rows.
 * Usage: node --experimental-strip-types scripts/delete-quran-record.ts <date> [email]
 * Requires DATABASE_URL in env or .env.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [date, email = "user@personalos.dev"] = process.argv.slice(2);
if (!date) { console.error("usage: delete-quran-record.ts <YYYY-MM-DD> [email]"); process.exit(1); }

const user = await prisma.user.findUnique({ where: { email } });
if (!user) { console.error("user not found"); process.exit(1); }

const res = await prisma.quranRecord.deleteMany({
  where: { userId: user.id, date: new Date(`${date}T12:00:00.000Z`) },
});
console.log(`deleted ${res.count} quranRecord(s) for ${email} on ${date}`);
await prisma.$disconnect();