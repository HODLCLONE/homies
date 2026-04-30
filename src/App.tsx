import GameCanvas from './components/GameCanvas';
import { getRoomUpgradeCost, resetGame, upgradeRoom, useGameStore } from './store/store';

const numberFormat = new Intl.NumberFormat('en-US');

function format(value: number) {
  if (!Number.isFinite(value)) return 'Max';
  return numberFormat.format(value);
}

export default function App() {
  const state = useGameStore((current) => current);
  const roomCost = getRoomUpgradeCost(state.roomLevel + 1);
  const maxRoom = state.roomLevel >= 3;
  const slotCount = state.roomLevel === 1 ? 5 : state.roomLevel === 2 ? 10 : 20;

  return (
    <div className="app-shell">
      <header className="top-panel">
        <div>
          <p className="eyebrow">HODL Homies</p>
          <h1>Homies</h1>
        </div>
        <div className="stats-grid" aria-label="Game stats">
          <div className="stat-card">
            <span>Coins</span>
            <strong>{format(state.coins)}</strong>
          </div>
          <div className="stat-card">
            <span>Taps</span>
            <strong>{format(state.taps)}</strong>
          </div>
          <div className="stat-card">
            <span>Room</span>
            <strong>Lv {state.roomLevel}/3</strong>
          </div>
        </div>
      </header>

      <main className="stage-wrap">
        <GameCanvas roomLevel={state.roomLevel} onTap={() => undefined} />
      </main>

      <nav className="bottom-panel" aria-label="Game actions">
        <div className="room-copy">
          <span>{slotCount} slots active</span>
          <strong>{maxRoom ? 'Max room reached' : `Next room: ${format(roomCost)} coins`}</strong>
        </div>
        <div className="actions-row">
          <button type="button" onClick={upgradeRoom} disabled={maxRoom || state.coins < roomCost}>
            {maxRoom ? 'Room Max' : 'Upgrade Room'}
          </button>
          <button type="button" className="secondary" onClick={resetGame}>
            Reset
          </button>
        </div>
      </nav>
    </div>
  );
}
