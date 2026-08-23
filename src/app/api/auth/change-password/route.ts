import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { currentPassword, newPassword, confirmPassword } = body;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || typeof confirmPassword !== "string") {
      return NextResponse.json(
        { error: "currentPassword, newPassword and confirmPassword are required" },
        { status: 400 }
      );
    }
    if (newPassword.length < MIN_LENGTH) {
      return NextResponse.json(
        { error: `New password must be at least ${MIN_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });
    if (!user?.password) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const currentValid = await compare(currentPassword, user.password);
    if (!currentValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const sameAsCurrent = await compare(newPassword, user.password);
    if (sameAsCurrent) {
      return NextResponse.json(
        { error: "New password must be different from the current password" },
        { status: 400 }
      );
    }

    const hashed = await hash(newPassword, BCRYPT_ROUNDS);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Note (JWT strategy): the current session stays valid; all logins from now
    // on require the new password. Plaintext is never stored or logged.
    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}