import { NextResponse } from "next/server";
import { getMockDiscovery, type DiscoveryMode } from "@/lib/mock-discovery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get("mode");
  const mode: DiscoveryMode = modeParam === "niche" || modeParam === "people" ? modeParam : "random";

  return NextResponse.json({
    item: getMockDiscovery(mode),
    mode,
    generatedAt: new Date().toISOString(),
  });
}
