import { NextRequest, NextResponse } from "next/server";
import { getPrayerTimesForDate, getNextPrayer, LocationConfig } from "@/lib/prayer-times";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") || "31.5204");
  const lng = parseFloat(searchParams.get("lng") || "74.3587");
  const method = searchParams.get("method") || "Karachi";
  const madhab = searchParams.get("madhab") || "Hanafi";
  const dateStr = searchParams.get("date");
  const parsedDate = dateStr ? new Date(`${dateStr}T12:00:00`) : null;
  const targetDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

  const config: LocationConfig = {
    latitude: lat,
    longitude: lng,
    method,
    madhab,
  };

  const prayers = getPrayerTimesForDate(targetDate, config);
  const nextPrayer = getNextPrayer(config);

  return NextResponse.json({
    date: targetDate.toISOString().split("T")[0],
    location: { latitude: lat, longitude: lng },
    method,
    madhab,
    prayers: prayers.filter((p) => p.name !== "Sunrise"),
    nextPrayer,
  });
}