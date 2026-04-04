"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscoveryItem, DiscoveryMode } from "@/lib/mock-discovery";

const MODES: DiscoveryMode[] = ["random", "niche", "people"];

async function loadItem(mode: DiscoveryMode): Promise<DiscoveryItem> {
  const response = await fetch(`/api/discover?mode=${mode}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load discovery item");
  const data = (await response.json()) as { item: DiscoveryItem };
  return data.item;
}

export function StmblClient() {
  const [mode, setMode] = useState<DiscoveryMode>("random");
  const [item, setItem] = useState<DiscoveryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);

  const refresh = useCallback(async (nextMode: DiscoveryMode) => {
    setLoading(true);
    try {
      const nextItem = await loadItem(nextMode);
      setItem(nextItem);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(mode);
  }, [mode, refresh]);

  const onSave = () => {
    if (!item) return;
    setSaved((current) => (current.includes(item.id) ? current : [...current, item.id]));
  };

  return (
    <div className="stmbl-shell">
      <header className="glass-panel hero-panel">
        <div>
          <p className="eyebrow">Farcaster Mini App Prototype</p>
          <h1>STMBL</h1>
          <p className="hero-copy">Stumble through high-signal Farcaster casts and people without drowning in sludge.</p>
        </div>
        <div className="hero-chip-stack">
          <span className="hero-chip">Dark</span>
          <span className="hero-chip">Liquid Glass</span>
          <span className="hero-chip">Neynar-ready</span>
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
            <p>Scanning filtered Farcaster pools…</p>
          </div>
        ) : (
          <>
            <div className="card-meta-row">
              <span className="item-type">{item.type}</span>
              <span className="score-chip">score {Math.round(item.neynarScore * 100)}</span>
            </div>
            <h2>{item.author}</h2>
            <p className="handle-line">{item.handle}</p>
            <p className="reason-line">{item.reason}</p>
            {item.type === "cast" ? <p className="body-copy">“{item.text}”</p> : <p className="body-copy">{item.bio}</p>}
            <div className="detail-grid">
              <div>
                <span className="detail-label">Context</span>
                <p>{item.type === "cast" ? item.channel : "Quality user"}</p>
              </div>
              <div>
                <span className="detail-label">Signal</span>
                <p>{item.engagement}</p>
              </div>
            </div>
            <div className="action-row">
              <button type="button" className="action-button" onClick={() => void refresh(mode)}>
                Next
              </button>
              <button type="button" className="action-button" onClick={onSave}>
                {saved.includes(item.id) ? "Saved" : "Save"}
              </button>
              <a href={item.href} target="_blank" rel="noreferrer" className="action-button is-link">
                Open
              </a>
            </div>
          </>
        )}
      </section>

      <section className="card-grid" aria-label="Scaffold status">
        <article className="glass-panel sub-panel">
          <p className="eyebrow">Modes</p>
          <h3>Random / Niche / People</h3>
          <p>Enough to prove the loop before real Neynar ingestion and scoring land.</p>
        </article>
        <article className="glass-panel sub-panel">
          <p className="eyebrow">Next up</p>
          <h3>Real filtered pools</h3>
          <p>Swap mock items for cached discovery pools scored with Neynar trust and engagement quality.</p>
        </article>
      </section>
    </div>
  );
}
