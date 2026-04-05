"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  defaultDiscoverySettings,
  discoverySettingsStorageKeyForUser,
  type DiscoverySettings,
} from "@/lib/discovery-config";
import type { DiscoveryItem, DiscoveryResponse } from "@/lib/discovery";

const MAX_SEEN_IDS = 40;

function getIgnoreKey(item: DiscoveryItem): string {
  if (item.type === "cast") return `cast:${item.hash}`;
  if (item.type === "user") return `user:${item.username}`;
  return `channel:${item.slug}`;
}

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

async function loadItem(seenIds: string[] = [], settings: DiscoverySettings): Promise<DiscoveryResponse> {
  const params = new URLSearchParams();
  if (seenIds.length > 0) params.set("seen", seenIds.join(","));
  if (settings.blacklistedUsernames.length > 0) params.set("blacklistedUsers", settings.blacklistedUsernames.join(","));
  if (settings.blacklistedChannels.length > 0) params.set("blacklistedChannels", settings.blacklistedChannels.join(","));
  if (settings.ignoredKeys.length > 0) params.set("ignored", settings.ignoredKeys.join(","));

  const query = params.toString();
  const response = await fetch(`/api/discover${query ? `?${query}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load discovery item");
  return (await response.json()) as DiscoveryResponse;
}

async function openItem(item: DiscoveryItem) {
  const inMiniApp = await sdk.isInMiniApp().catch(() => false);

  if (inMiniApp) {
    if (item.type === "cast") {
      await sdk.actions.viewCast({ hash: item.hash, authorUsername: item.authorUsername });
      return;
    }

    if (item.type === "user" && item.fid) {
      await sdk.actions.viewProfile({ fid: item.fid });
      return;
    }

    await sdk.actions.openUrl(item.href);
    return;
  }

  window.location.href = item.href;
}

export function StmblClient() {
  const [item, setItem] = useState<DiscoveryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [storageKey, setStorageKey] = useState(() => discoverySettingsStorageKeyForUser());
  const [settings, setSettings] = useState<DiscoverySettings>(defaultDiscoverySettings());

  useEffect(() => {
    let active = true;

    sdk.context
      .then((context) => {
        if (!active) return;
        const nextKey = discoverySettingsStorageKeyForUser(context.user.fid);
        setStorageKey(nextKey);
        setSettings(readSettings(nextKey));
      })
      .catch(() => {
        if (!active) return;
        const nextKey = discoverySettingsStorageKeyForUser();
        setStorageKey(nextKey);
        setSettings(readSettings(nextKey));
      });

    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await loadItem(seenIds, settings);
      setItem(payload.item);
      setSeenIds((current) => (current.includes(payload.item.id) ? current : [...current, payload.item.id].slice(-MAX_SEEN_IDS)));
    } finally {
      setLoading(false);
    }
  }, [seenIds, settings]);

  const bodyCopy = useMemo(() => {
    if (!item) return "";
    if (item.type === "cast") return `“${item.text}”`;
    return item.bio;
  }, [item]);

  useEffect(() => {
    void sdk.actions.ready().catch(() => {
      // Ignore when outside Farcaster mini app host.
    });
  }, []);

  useEffect(() => {
    if (!item) {
      void refresh();
    }
  }, [item, refresh]);

  const ignoreCurrent = async () => {
    if (!item) return;
    const nextSettings = {
      ...settings,
      ignoredKeys: [...new Set([...settings.ignoredKeys, getIgnoreKey(item)])],
    };
    setSettings(nextSettings);
    writeSettings(storageKey, nextSettings);
    setSeenIds((current) => [...new Set([...current, item.id])].slice(-MAX_SEEN_IDS));
    setItem(null);
  };

  return (
    <div className="stmbl-shell">
      <section className="glass-panel control-panel" aria-label="Discovery controls">
        <button type="button" className="stumble-button" onClick={() => void refresh()}>
          STUMBLE
        </button>
      </section>

      <section className="glass-panel card-panel" aria-label="Discovery result">
        {loading || !item ? (
          <div className="loading-state">
            <div className="loading-orb" />
            <p>Scanning Farcaster…</p>
          </div>
        ) : (
          <>
            <div className="card-meta-row">
              <span className="item-type">{item.type}</span>
              <span className="score-chip">score {Math.round(item.neynarScore * 100)}</span>
            </div>
            <div className="result-link">
              <h2>{item.author}</h2>
              <p className="handle-line">{item.handle}</p>
              <p className="body-copy">{bodyCopy}</p>
              <div className="detail-grid">
                <div>
                  <span className="detail-label">Where</span>
                  <p>{item.type === "cast" ? item.channel : item.type === "channel" ? "Channel" : "Person"}</p>
                </div>
                <div>
                  <span className="detail-label">Signal</span>
                  <p>{item.engagement}</p>
                </div>
              </div>
            </div>
            <div className="action-row">
              <button type="button" className="action-button" onClick={() => void ignoreCurrent()}>
                Ignore
              </button>
              <button type="button" className="action-button text-link" onClick={() => void openItem(item)}>
                Open
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
