import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrayerTimesForDate, getNextPrayer, LocationConfig } from "@/lib/prayer-times";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prayer configuration lives in user settings; query params only override
    // for explicit testing and never fall back to hardcoded locations.
    const settings = await db.userSettings.findUnique({ where: { userId: session.user.id } });
    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const method = searchParams.get("method") || undefined;
    const madhab = searchParams.get("madhab") || undefined;
    const dateStr = searchParams.get("date");

    let targetDate: Date | null = null;
    if (dateStr) {
      targetDate = new Date(`${dateStr}T12:00:00Z`);
      if (isNaN(targetDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return NextResponse.json({ error: "date must be a valid YYYY-MM-DD string" }, { status: 400 });
      }
    }

    const config: LocationConfig = {
      latitude: lat !== null ? parseFloat(lat) : settings.latitude,
      longitude: lng !== null ? parseFloat(lng) : settings.longitude,
      method: method ?? settings.prayerCalcMethod,
      madhab: madhab ?? settings.juristicMethod,
      timezone: settings.timezone,
    };

    if (!isFinite(config.latitude) || !isFinite(config.longitude)) {
      return NextResponse.json({ error: "lat/lng must be valid numbers" }, { status: 400 });
    }

    const reference = targetDate ?? new Date();
    const prayers = getPrayerTimesForDate(reference, config);

    // The response date must be the calendar day of the requested times in the
    // user's timezone — not the server's UTC date.
    const tzParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: settings.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(targetDate ?? new Date());

    return NextResponse.json({
      date: dateStr ?? tzParts,
      timezone: settings.timezone,
      location: {
        latitude: config.latitude,
        longitude: config.longitude,
        label: settings.location,
      },
      method: config.method,
      madhab: config.madhab,
      prayers: prayers.filter((p) => p.name !== "Sunrise"),
      nextPrayer: getNextPrayer(config),
    });
  } catch (error) {
    console.error("Prayers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
