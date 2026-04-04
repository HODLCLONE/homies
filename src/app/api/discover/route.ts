import { NextResponse } from "next/server";
import { getDiscovery } from "@/lib/mock-discovery";

export async function GET() {
  return NextResponse.json({
    item: getDiscovery(),
    generatedAt: new Date().toISOString(),
  });
}
