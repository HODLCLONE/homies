"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import type { DiscoveryItem, DiscoveryMode, DiscoveryResponse } from "@/lib/discovery";

const MAX_SEEN_IDS = 40;
const MODES: DiscoveryMode[] = ["random", "niche", "people"];

async function loadItem(mode: DiscoveryMode, seenIds: string[] = []): Promise<DiscoveryResponse> {
  const params = new URLSearchParams({ mode });
  if (seenIds.length > 0) {
    params.set("seen", seenIds.join(","));
  }

  const response = await fetch(`/api/discover?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load discovery item");
  return (await response.json()) as DiscoveryResponse;
}

export function StmblClient() {
  const [mode, setMode] = useState<DiscoveryMode>("random");
  const [item, setItem] = useState<DiscoveryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ source: DiscoveryResponse["source"]; generatedAt: string; poolSize: number } | null>(null);
  const [seenByMode, setSeenByMode] = useState<Record<DiscoveryMode, string[]>>({
    random: [],
    niche: [],
    people: [],
  });
  const seenByModeRef = useRef(seenByMode);

  useEffect(() => {
    seenByModeRef.current = seenByMode;
  }, [seenByMode]);

  const refresh = useCallback(async (nextMode: DiscoveryMode) => {
    setLoading(true);
    try {
      const payload = await loadItem(nextMode, seenByModeRef.current[nextMode]);
      setItem(payload.item);
      setMeta({ source: payload.source, generatedAt: payload.generatedAt, poolSize: payload.poolSize });
      setSeenByMode((current) => ({
        ...current,
        [nextMode]: current[nextMode].includes(payload.item.id)
          ? current[nextMode]
          : [...current[nextMode], payload.item.id].slice(-MAX_SEEN_IDS),
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void sdk.actions.ready().catch(() => {
      // Ignore when outside Farcaster mini app host.
    });
  }, []);

  useEffect(() => {
    void refresh(mode);
  }, [mode, refresh]);

  return (
    <div className="stmbl-shell">
      <header className="glass-panel hero-panel">
        <div>
          <p className="eyebrow">Live Farcaster discovery</p>
          <h1>Find your next corner of Farcaster.</h1>
          <p className="hero-copy">STMBL now serves cached live casts, people, and channels rebuilt from Neynar.</p>
        </div>
        <div className="hero-chip-row">
          <span className="hero-chip">casts</span>
          <span className="hero-chip">people</span>
          <span className="hero-chip">channels</span>
          <span className="hero-chip">cached pools</span>
        </div>
      </header>

      <section className="glass-panel control-panel" aria-label="Discovery controls">
        <div className="mode-row">
          {MODES.map((entry) => (
            <button
              key={entry}
              type="button"
              className={`mode-pill ${mode === entry ? "is-active" : ""}`}
              onClick={() => setMode(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
        <button type="button" className="stumble-button" onClick={() => void refresh(mode)}>
          STUMBLE
        </button>
      </section>

      <section className="glass-panel card-panel" aria-label="Discovery result">
        {loading || !item ? (
          <div className="loading-state">
            <div className="loading-orb" />
            <p>Scanning cached Farcaster pools…</p>
          </div>
        ) : (
          <>
            <div className="card-meta-row">
              <span className="item-type">{item.type}</span>
              <span className="score-chip">score {Math.round(item.neynarScore * 100)}</span>
            </div>
            <a href={item.href} target="_blank" rel="noreferrer" className="result-link">
              <h2>{item.author}</h2>
              <p className="handle-line">{item.handle}</p>
              <p className="reason-line">{item.reason}</p>
              <p className="body-copy">
                {item.type === "cast" ? `“${item.text}”` : item.bio}
              </p>
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
            </a>
            <div className="card-footer-row">
              <div className="pool-caption">
                {meta ? `${meta.source} pool · ${meta.poolSize} items · ${new Date(meta.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
              </div>
              <div className="action-row">
                <a href={item.href} target="_blank" rel="noreferrer" className="action-button text-link">
                  Open
                </a>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="card-grid" aria-label="Discovery notes">
        <article className="glass-panel sub-panel">
          <p className="eyebrow">Random</p>
          <h3>Mixed live surface</h3>
          <p>Casts, users, and channels come from prebuilt live pools instead of one-off API hits.</p>
        </article>
        <article className="glass-panel sub-panel">
          <p className="eyebrow">Niche</p>
          <h3>Stronger weirdness filter</h3>
          <p>Reply density, channel presence, lower-tourist virality, and stronger text depth get boosted.</p>
        </article>
      </section>
    </div>
  );
}
