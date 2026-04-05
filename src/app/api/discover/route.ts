import { NextResponse } from "next/server";
import { getDiscovery } from "@/lib/discovery";
import { parseList } from "@/lib/discovery-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seenParam = searchParams.get("seen") ?? searchParams.get("exclude") ?? "";
  const seenIds = seenParam
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const payload = await getDiscovery("random", seenIds, {
    blacklistedUsernames: parseList(searchParams.get("blacklistedUsers") ?? ""),
    blacklistedChannels: parseList(searchParams.get("blacklistedChannels") ?? ""),
    ignoredKeys: parseList(searchParams.get("ignored") ?? ""),
  });

  return NextResponse.json(payload, {
    headers: {
      "cache-control": "no-store, max-age=0",
    },
  });
}
