import { useEffect, useMemo, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import {
  SHOP_ITEMS,
  type ShopTab,
  buyItem,
  getClickPower,
  getItemCost,
  getPerSecond,
  getRoomUpgradeCost,
  resetGame,
  startPassiveIncome,
  upgradeRoom,
  useGameStore,
} from './store/store';

const tabs: Array<{ id: ShopTab; icon: string; label: string }> = [
  { id: 'click', icon: '⚡', label: 'Tap' },
  { id: 'auto', icon: '⏱️', label: 'Auto' },
  { id: 'upgrades', icon: '⬆️', label: 'Boosts' },
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
  const nextRoomCost = getRoomUpgradeCost(state.roomLevel + 1);
  const canUpgradeRoom = state.roomLevel < 3 && state.coins >= nextRoomCost;

  useEffect(() => startPassiveIncome(), []);

  return (
    <div className={`app-shell ${shopOpen ? 'shop-is-open' : ''}`}>
      <header className="score-header">
        <button type="button" className="round-icon" aria-label="Stats">◎</button>
        <div className="score-copy">
          <h1>Homies</h1>
          <strong>{formatCompact(state.coins)} HODL</strong>
          <span>+{formatCompact(clickPower)} per tap · {formatCompact(perSecond)}/sec</span>
          <p>Room {state.roomLevel} · {state.taps.toLocaleString()} taps</p>
        </div>
        <button type="button" className="round-avatar" aria-label="OG Homie">
          <img src="/assets/HODL_FINAL_HERMES_ASSETS/character/homie_player_idle.png" alt="OG Homie" />
        </button>
      </header>

      <main className="tap-stage">
        <GameCanvas roomLevel={state.roomLevel} onTap={() => undefined} />
      </main>

      <nav className="bottom-dock" aria-label="Game actions">
        <button type="button" className="room-button" onClick={upgradeRoom} disabled={!canUpgradeRoom}>
          <span>HQ</span>
          <strong>{state.roomLevel >= 3 ? 'Max room' : `Upgrade ${formatCompact(nextRoomCost)}`}</strong>
        </button>
        <button type="button" className="shop-button" onClick={() => setShopOpen(true)}>
          <span>＋</span>
          <strong>Upgrades</strong>
          <em>{SHOP_ITEMS.length}</em>
        </button>
      </nav>

      {shopOpen && <button type="button" className="shop-backdrop" aria-label="Close upgrades" onClick={() => setShopOpen(false)} />}

      <section className={`shop-sheet ${shopOpen ? 'open' : ''}`} aria-hidden={!shopOpen}>
        <div className="sheet-handle" />
        <div className="shop-title-row">
          <h2>Upgrades</h2>
          <button type="button" className="sheet-close" onClick={() => setShopOpen(false)} aria-label="Close upgrades">×</button>
        </div>

        <div className="shop-tabs" role="tablist" aria-label="Upgrade categories">
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
