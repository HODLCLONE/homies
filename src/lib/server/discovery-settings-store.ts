import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultDiscoverySettings, type DiscoverySettings } from "@/lib/discovery-config";

const LOCAL_DB_DIR = path.join(process.cwd(), ".data");
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, "discovery-settings.json");
const SETTINGS_HASH_KEY = "stmbl:discovery-settings:by-fid";

type LocalDbShape = {
  byFid: Record<string, DiscoverySettings>;
};

const memoryStore = new Map<string, DiscoverySettings>();

function normalizeSettings(settings: Partial<DiscoverySettings> | null | undefined): DiscoverySettings {
  const defaults = defaultDiscoverySettings();
  return {
    blacklistedUsernames: [...new Set((settings?.blacklistedUsernames ?? defaults.blacklistedUsernames).map((entry) => entry.trim()).filter(Boolean))],
    blacklistedChannels: [...new Set((settings?.blacklistedChannels ?? defaults.blacklistedChannels).map((entry) => entry.trim()).filter(Boolean))],
    ignoredKeys: [...new Set((settings?.ignoredKeys ?? []).map((entry) => entry.trim()).filter(Boolean))],
  };
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function runUpstashCommand(command: Array<string>) {
  const config = getUpstashConfig();
  if (!config) return null;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upstash command failed: ${text.slice(0, 240)}`);
  }

  return (await response.json()) as { result?: string | null };
}

async function readLocalDb(): Promise<LocalDbShape> {
  try {
    const raw = await fs.readFile(LOCAL_DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDbShape>;
    return {
      byFid: parsed.byFid ?? {},
    };
  } catch {
    return { byFid: {} };
  }
}

async function writeLocalDb(next: LocalDbShape) {
  await fs.mkdir(LOCAL_DB_DIR, { recursive: true });
  const tmpPath = `${LOCAL_DB_FILE}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmpPath, LOCAL_DB_FILE);
}

export async function getDiscoverySettingsForFid(fid: number): Promise<DiscoverySettings> {
  const field = String(fid);

  try {
    const response = await runUpstashCommand(["HGET", SETTINGS_HASH_KEY, field]);
    if (response?.result) {
      return normalizeSettings(JSON.parse(response.result));
    }
  } catch (error) {
    if (getUpstashConfig()) throw error;
  }

  try {
    const local = await readLocalDb();
    if (local.byFid[field]) return normalizeSettings(local.byFid[field]);
  } catch {
    // ignore local fallback read errors
  }

  return normalizeSettings(memoryStore.get(field));
}

export async function saveDiscoverySettingsForFid(fid: number, settings: DiscoverySettings): Promise<DiscoverySettings> {
  const field = String(fid);
  const normalized = normalizeSettings(settings);
  const json = JSON.stringify(normalized);

  try {
    await runUpstashCommand(["HSET", SETTINGS_HASH_KEY, field, json]);
  } catch (error) {
    if (getUpstashConfig()) throw error;
  }

  try {
    const local = await readLocalDb();
    local.byFid[field] = normalized;
    await writeLocalDb(local);
  } catch {
    // ignore local fallback write errors
  }

  memoryStore.set(field, normalized);
  return normalized;
}
