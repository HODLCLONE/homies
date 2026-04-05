import { NextResponse } from "next/server";
import { getDiscovery, type DiscoveryMode } from "@/lib/discovery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get("mode");
  const seenParam = searchParams.get("seen") ?? searchParams.get("exclude") ?? "";
  const mode: DiscoveryMode = modeParam === "niche" || modeParam === "people" ? modeParam : "random";
  const seenIds = seenParam
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const payload = await getDiscovery(mode, seenIds);
  return NextResponse.json(payload, {
    headers: {
      "cache-control": "no-store, max-age=0",
    },
  });
}
