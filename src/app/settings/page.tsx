"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  defaultDiscoverySettings,
  joinList,
  parseList,
  type DiscoverySettings,
} from "@/lib/discovery-config";

async function loadServerSettings(fid: number | null): Promise<DiscoverySettings> {
  if (!fid) return defaultDiscoverySettings();
  const response = await fetch(`/api/settings?fid=${fid}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load settings");
  const payload = (await response.json()) as { settings: DiscoverySettings };
  return payload.settings;
}

async function saveServerSettings(fid: number | null, settings: DiscoverySettings): Promise<DiscoverySettings> {
  if (!fid) return settings;
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fid, settings }),
  });
  if (!response.ok) throw new Error("Failed to save settings");
  const payload = (await response.json()) as { settings: DiscoverySettings };
  return payload.settings;
}

export default function SettingsPage() {
  const [fid, setFid] = useState<number | null>(null);
  const [userBlacklist, setUserBlacklist] = useState("");
  const [channelBlacklist, setChannelBlacklist] = useState("");
  const [ignoredKeys, setIgnoredKeys] = useState("");
  const [saved, setSaved] = useState(false);
  const [scopeLabel, setScopeLabel] = useState("anonymous browser session");

  useEffect(() => {
    let active = true;

    sdk.context
      .then(async (context) => {
        if (!active) return;
        const nextFid = context.user.fid;
        const nextSettings = await loadServerSettings(nextFid);
        if (!active) return;
        setFid(nextFid);
        setScopeLabel(context.user.username ? `@${context.user.username}` : `fid ${context.user.fid}`);
        setUserBlacklist(joinList(nextSettings.blacklistedUsernames));
        setChannelBlacklist(joinList(nextSettings.blacklistedChannels));
        setIgnoredKeys(nextSettings.ignoredKeys.join("\n"));
      })
      .catch(() => {
        if (!active) return;
        setFid(null);
        setScopeLabel("anonymous browser session");
        const defaults = defaultDiscoverySettings();
        setUserBlacklist(joinList(defaults.blacklistedUsernames));
        setChannelBlacklist(joinList(defaults.blacklistedChannels));
        setIgnoredKeys(defaults.ignoredKeys.join("\n"));
      });

    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    const next = {
      blacklistedUsernames: parseList(userBlacklist),
      blacklistedChannels: parseList(channelBlacklist),
      ignoredKeys: ignoredKeys
        .split(/\n/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    } satisfies DiscoverySettings;

    const savedSettings = await saveServerSettings(fid, next);
    setUserBlacklist(joinList(savedSettings.blacklistedUsernames));
    setChannelBlacklist(joinList(savedSettings.blacklistedChannels));
    setIgnoredKeys(savedSettings.ignoredKeys.join("\n"));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const resetIgnored = async () => {
    const next = {
      blacklistedUsernames: parseList(userBlacklist),
      blacklistedChannels: parseList(channelBlacklist),
      ignoredKeys: [],
    } satisfies DiscoverySettings;

    const savedSettings = await saveServerSettings(fid, next);
    setIgnoredKeys(savedSettings.ignoredKeys.join("\n"));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <main className="page-shell page-stack">
      <div className="glass-panel sub-page-panel settings-panel">
        <p className="eyebrow">Discovery controls</p>
        <h1>Settings</h1>
        <p className="body-copy">Settings scope: {scopeLabel}</p>
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
          <button type="button" className="action-button text-link" onClick={() => void save()}>
            {saved ? "Saved" : "Save"}
          </button>
          <button type="button" className="action-button" onClick={() => void resetIgnored()}>
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
