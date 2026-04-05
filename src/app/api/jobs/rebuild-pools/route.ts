import { NextResponse } from "next/server";
import { rebuildDiscoveryPools } from "@/lib/discovery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function runRebuild() {
  const snapshot = await rebuildDiscoveryPools();
  return NextResponse.json({
    ok: true,
    generatedAt: snapshot.generatedAt,
    randomPool: snapshot.pools.random.length,
    nichePool: snapshot.pools.niche.length,
    peoplePool: snapshot.pools.people.length,
  });
}

export async function GET() {
  return runRebuild();
}

export async function POST() {
  return runRebuild();
}
