"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  defaultDiscoverySettings,
  discoverySettingsStorageKeyForUser,
  joinList,
  parseList,
  type DiscoverySettings,
} from "@/lib/discovery-config";

function readSettings(storageKey: string): DiscoverySettings {
  if (typeof window === "undefined") return defaultDiscoverySettings();

  try {
    const raw = window.localStorage.getItem(storageKey);
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

function writeSettings(storageKey: string, settings: DiscoverySettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(settings));
}

export default function SettingsPage() {
  const [storageKey, setStorageKey] = useState(() => discoverySettingsStorageKeyForUser());
  const initialSettings = useMemo(() => readSettings(storageKey), [storageKey]);
  const [userBlacklist, setUserBlacklist] = useState(() => joinList(initialSettings.blacklistedUsernames));
  const [channelBlacklist, setChannelBlacklist] = useState(() => joinList(initialSettings.blacklistedChannels));
  const [ignoredKeys, setIgnoredKeys] = useState(() => initialSettings.ignoredKeys.join("\n"));
  const [saved, setSaved] = useState(false);
  const [scopeLabel, setScopeLabel] = useState("anonymous browser session");

  useEffect(() => {
    let active = true;

    sdk.context
      .then((context) => {
        if (!active) return;
        const nextKey = discoverySettingsStorageKeyForUser(context.user.fid);
        const nextSettings = readSettings(nextKey);
        setStorageKey(nextKey);
        setScopeLabel(context.user.username ? `@${context.user.username}` : `fid ${context.user.fid}`);
        setUserBlacklist(joinList(nextSettings.blacklistedUsernames));
        setChannelBlacklist(joinList(nextSettings.blacklistedChannels));
        setIgnoredKeys(nextSettings.ignoredKeys.join("\n"));
      })
      .catch(() => {
        if (!active) return;
        const nextKey = discoverySettingsStorageKeyForUser();
        const nextSettings = readSettings(nextKey);
        setStorageKey(nextKey);
        setScopeLabel("anonymous browser session");
        setUserBlacklist(joinList(nextSettings.blacklistedUsernames));
        setChannelBlacklist(joinList(nextSettings.blacklistedChannels));
        setIgnoredKeys(nextSettings.ignoredKeys.join("\n"));
      });

    return () => {
      active = false;
    };
  }, []);

  const save = () => {
    writeSettings(storageKey, {
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
    const settings = readSettings(storageKey);
    const next = { ...settings, ignoredKeys: [] };
    writeSettings(storageKey, next);
    setIgnoredKeys("");
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
