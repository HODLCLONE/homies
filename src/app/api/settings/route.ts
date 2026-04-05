import { NextResponse } from "next/server";
import { defaultDiscoverySettings, type DiscoverySettings } from "@/lib/discovery-config";
import { getDiscoverySettingsForFid, saveDiscoverySettingsForFid } from "@/lib/server/discovery-settings-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseFid(value: string | null): number | null {
  if (!value) return null;
  const fid = Number.parseInt(value, 10);
  return Number.isFinite(fid) && fid > 0 ? fid : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fid = parseFid(searchParams.get("fid"));

  if (!fid) {
    return NextResponse.json({ settings: defaultDiscoverySettings(), scope: "anon" });
  }

  const settings = await getDiscoverySettingsForFid(fid);
  return NextResponse.json({ settings, scope: `fid:${fid}` });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { fid?: number; settings?: DiscoverySettings };
  const fid = body?.fid;
  if (!fid || !Number.isFinite(fid) || fid <= 0) {
    return NextResponse.json({ error: "valid_fid_required" }, { status: 400 });
  }

  const settings = await saveDiscoverySettingsForFid(fid, body.settings ?? defaultDiscoverySettings());
  return NextResponse.json({ ok: true, settings, scope: `fid:${fid}` });
}
