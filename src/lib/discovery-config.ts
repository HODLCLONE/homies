export const DEFAULT_BLACKLISTED_USERNAMES = [
  "farcaster",
  "dwr",
  "dwr.eth",
  "v",
  "varun",
  "dan",
  "danromero",
  "rish",
  "rish0x",
  "anton",
  "merkle",
];

export const DEFAULT_BLACKLISTED_CHANNELS = ["farcaster", "fc"];

export const DISCOVERY_SETTINGS_STORAGE_KEY = "stmbl.discovery.settings.v1";

export type DiscoverySettings = {
  blacklistedUsernames: string[];
  blacklistedChannels: string[];
  ignoredKeys: string[];
};

export function normalizeHandle(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/^[@/]/, "");
}

export function uniqueNormalized(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeHandle(value)).filter(Boolean))];
}

export function parseList(value: string): string[] {
  return uniqueNormalized(
    value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export function joinList(values: string[]): string {
  return uniqueNormalized(values).join("\n");
}

export function defaultDiscoverySettings(): DiscoverySettings {
  return {
    blacklistedUsernames: [...DEFAULT_BLACKLISTED_USERNAMES],
    blacklistedChannels: [...DEFAULT_BLACKLISTED_CHANNELS],
    ignoredKeys: [],
  };
}
