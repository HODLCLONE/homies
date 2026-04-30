import { useEffect, useMemo, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import {
  SHOP_ITEMS,
  type ShopTab,
  buyItem,
  getClickPower,
  getItemCost,
  getPerSecond,
  resetGame,
  startPassiveIncome,
  useGameStore,
} from './store/store';

const tabs: Array<{ id: ShopTab; icon: string; label: string }> = [
  { id: 'click', icon: '☝️', label: 'Click' },
  { id: 'auto', icon: '⏱️', label: 'Auto' },
  { id: 'upgrades', icon: '⬆️', label: 'Upgrades' },
  { id: 'nft', icon: '💎', label: 'NFT' },
];

function formatCompact(value: number) {
  if (!Number.isFinite(value)) return '∞';
  if (value >= 1_000_000_000) return `${trim(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trim(value / 1_000)}K`;
  return new Intl.NumberFormat('en-US').format(Math.floor(value));
}

function trim(value: number) {
  return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

export default function App() {
  const state = useGameStore((current) => current);
  const [shopOpen, setShopOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ShopTab>('click');
  const clickPower = getClickPower(state);
  const perSecond = getPerSecond(state);
  const visibleItems = useMemo(() => SHOP_ITEMS.filter((item) => item.tab === activeTab), [activeTab]);

  useEffect(() => startPassiveIncome(), []);

  return (
    <div className={`app-shell ${shopOpen ? 'shop-is-open' : ''}`}>
      <header className="score-header">
        <button type="button" className="round-icon trophy" aria-label="Achievements">🏆</button>
        <div className="score-copy">
          <h1>Homies</h1>
          <strong>{formatCompact(state.coins)} cookies</strong>
          <span>+{formatCompact(clickPower)} per click · {formatCompact(perSecond)}/sec</span>
          <p>⭐ Prestige Lv.0 (+10.8%) · Next: {formatCompact(Math.max(1000, state.coins * 2))}</p>
        </div>
        <button type="button" className="round-avatar" aria-label="Profile">
          <img src="/assets/HODL_FINAL_HERMES_ASSETS/character/homie_player_idle.png" alt="OG Homie" />
        </button>
      </header>

      <main className="clicker-stage">
        <GameCanvas roomLevel={state.roomLevel} onTap={() => undefined} />
      </main>

      <nav className="bottom-dock" aria-label="Game actions">
        <button type="button" className="dock-icon" aria-label="Expand">↗</button>
        <button type="button" className="dock-star" aria-label="Prestige">⭐</button>
        <button type="button" className="shop-button" onClick={() => setShopOpen(true)}>
          <span>🛒</span>
          <strong>Shop</strong>
          <em>{SHOP_ITEMS.length}</em>
        </button>
        <button type="button" className="vault-button" aria-label="Vault">V</button>
      </nav>

      {shopOpen && <button type="button" className="shop-backdrop" aria-label="Close shop" onClick={() => setShopOpen(false)} />}

      <section className={`shop-sheet ${shopOpen ? 'open' : ''}`} aria-hidden={!shopOpen}>
        <div className="sheet-handle" />
        <div className="shop-title-row">
          <h2>🛒 Shop</h2>
          <button type="button" className="sheet-close" onClick={() => setShopOpen(false)} aria-label="Close shop">×</button>
        </div>

        <div className="shop-tabs" role="tablist" aria-label="Shop categories">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === activeTab ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={tab.id === activeTab}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="shop-list">
          {visibleItems.map((item) => {
            const owned = state.owned[item.id] ?? 0;
            const cost = getItemCost(item);
            const affordable = state.coins >= cost;
            return (
              <button key={item.id} type="button" className="shop-item" onClick={() => buyItem(item.id)} disabled={!affordable}>
                <span className="item-icon">{item.icon}</span>
                <span className="item-copy">
                  <strong>{item.name} <em>×{owned}</em></strong>
                  <small>{item.description}</small>
                </span>
                <span className="item-cost">{formatCompact(cost)}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="reset-link" onClick={resetGame}>Reset run</button>
      </section>
    </div>
  );
}
