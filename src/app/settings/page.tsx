"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DISCOVERY_SETTINGS_STORAGE_KEY,
  defaultDiscoverySettings,
  joinList,
  parseList,
  type DiscoverySettings,
} from "@/lib/discovery-config";

function readSettings(): DiscoverySettings {
  if (typeof window === "undefined") return defaultDiscoverySettings();

  try {
    const raw = window.localStorage.getItem(DISCOVERY_SETTINGS_STORAGE_KEY);
    if (!raw) return defaultDiscoverySettings();
    const parsed = JSON.parse(raw) as Partial<DiscoverySettings>;
    return {
      blacklistedUsernames: parsed.blacklistedUsernames ?? defaultDiscoverySettings().blacklistedUsernames,
      blacklistedChannels: parsed.blacklistedChannels ?? defaultDiscoverySettings().blacklistedChannels,
      ignoredKeys: parsed.ignoredKeys ?? [],
    };
  } catch {
    return defaultDiscoverySettings();
  }
}

function writeSettings(settings: DiscoverySettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISCOVERY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export default function SettingsPage() {
  const initialSettings = useMemo(() => readSettings(), []);
  const [userBlacklist, setUserBlacklist] = useState(() => joinList(initialSettings.blacklistedUsernames));
  const [channelBlacklist, setChannelBlacklist] = useState(() => joinList(initialSettings.blacklistedChannels));
  const [ignoredKeys, setIgnoredKeys] = useState(() => initialSettings.ignoredKeys.join("\n"));
  const [saved, setSaved] = useState(false);

  const save = () => {
    writeSettings({
      blacklistedUsernames: parseList(userBlacklist),
      blacklistedChannels: parseList(channelBlacklist),
      ignoredKeys: ignoredKeys
        .split(/\n/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const resetIgnored = () => {
    const settings = readSettings();
    const next = { ...settings, ignoredKeys: [] };
    writeSettings(next);
    setIgnoredKeys("");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <main className="page-shell page-stack">
      <div className="glass-panel sub-page-panel settings-panel">
        <p className="eyebrow">Discovery controls</p>
        <h1>Settings</h1>
        <label className="settings-field">
          <span>Blacklisted accounts</span>
          <textarea
            value={userBlacklist}
            onChange={(event) => setUserBlacklist(event.target.value)}
            placeholder="one username per line"
            rows={10}
          />
        </label>
        <label className="settings-field">
          <span>Blacklisted channels</span>
          <textarea
            value={channelBlacklist}
            onChange={(event) => setChannelBlacklist(event.target.value)}
            placeholder="one channel slug per line"
            rows={5}
          />
        </label>
        <label className="settings-field">
          <span>Ignored entries</span>
          <textarea
            value={ignoredKeys}
            onChange={(event) => setIgnoredKeys(event.target.value)}
            placeholder="ignored result keys"
            rows={6}
          />
        </label>
        <div className="action-row">
          <button type="button" className="action-button text-link" onClick={save}>
            {saved ? "Saved" : "Save"}
          </button>
          <button type="button" className="action-button" onClick={resetIgnored}>
            Clear ignored
          </button>
          <Link href="/" className="action-button">
            Back
          </Link>
        </div>
      </div>
    </main>
  );
}
