import * as React from 'react';
import Game from './game/Game';
import HUD from './components/HUD';
import {
  getRoomUpgradeCost,
  upgradeAutoClick,
  upgradeClickPower,
  upgradeRoom,
  useGameStore,
} from './store/useGameStore';

const PANELS = ['upgrade', 'auto', 'room', 'homies'] as const;
type Panel = (typeof PANELS)[number];

const format = (value: number) => new Intl.NumberFormat('en-US').format(value);

function NavButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[60px] flex-1 items-center justify-center rounded-[18px] border px-3 text-sm font-extrabold uppercase tracking-[0.28em] transition active:scale-[0.98] ${
        active
          ? 'border-lime-300/40 bg-lime-300/15 text-lime-100 shadow-[0_0_0_1px_rgba(163,230,53,0.12)]'
          : 'border-white/10 bg-white/5 text-white/72 hover:bg-white/8'
      }`}
    >
      {label}
    </button>
  );
}

function DrawerAction({
  title,
  subtitle,
  accent,
  onClick,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  accent: 'lime' | 'yellow';
  onClick: () => void;
  disabled?: boolean;
}) {
  const accentClasses =
    accent === 'lime'
      ? 'border-lime-300/35 text-lime-100 hover:border-lime-200/55 hover:bg-lime-300/10'
      : 'border-yellow-300/35 text-yellow-50 hover:border-yellow-200/55 hover:bg-yellow-300/10';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[90px] w-full items-center justify-between gap-4 rounded-[22px] border bg-[#0b141d] px-4 py-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 ${accentClasses}`}
    >
      <div className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-[0.32em] text-white sm:text-sm">{title}</span>
        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">{subtitle}</span>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg font-black text-white">
        ↗
      </div>
    </button>
  );
}

function DrawerContent({ panel, onClose }: { panel: Panel; onClose: () => void }) {
  const state = useGameStore((s) => s);
  const upgradeCost = Math.max(25, 25 + (state.clickPower - 1) * 10);
  const autoClickCost = Math.max(60, 60 + state.autoClicksPerMinute * 40);
  const roomUpgradeCost = getRoomUpgradeCost();

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/50">Drawer</p>
          <h2 className="mt-1 text-xl font-black uppercase tracking-[0.2em] text-white">
            {panel === 'upgrade' ? 'Upgrade' : panel === 'auto' ? 'Auto' : panel === 'room' ? 'Room' : 'Homies'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold uppercase tracking-[0.24em] text-white/75"
        >
          Close
        </button>
      </div>

      {panel === 'upgrade' && (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-white/72">Boost tap power so each homie tap pays more. Gameplay stays the same.</p>
          <DrawerAction
            title="Click Power"
            subtitle={`Cost ${format(upgradeCost)} coins • +1 per tap`}
            accent="lime"
            onClick={upgradeClickPower}
            disabled={state.coins < upgradeCost}
          />
        </div>
      )}

      {panel === 'auto' && (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-white/72">Passive earnings continue in the background. Add more auto clicks here.</p>
          <DrawerAction
            title="Auto-click"
            subtitle={`Cost ${format(autoClickCost)} coins • +1/min`}
            accent="yellow"
            onClick={upgradeAutoClick}
            disabled={state.coins < autoClickCost}
          />
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-white/72">
            Current auto rate: <span className="font-bold text-white">{state.autoClicksPerMinute}/min</span>
          </div>
        </div>
      )}

      {panel === 'room' && (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-white/72">Room upgrades unlock more space later. The first jumps are intentionally pricey.</p>
          <DrawerAction
            title="Room Up"
            subtitle={`Lv ${state.roomLevel + 1} • Cost ${format(roomUpgradeCost)} coins`}
            accent="lime"
            onClick={upgradeRoom}
            disabled={state.coins < roomUpgradeCost}
          />
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-white/72">
            Current room: <span className="font-bold text-white">Lv {state.roomLevel}</span>
          </div>
        </div>
      )}

      {panel === 'homies' && (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-white/72">Inventory and future homie management will live here later.</p>
          <div className="rounded-[20px] border border-dashed border-white/12 bg-white/5 p-5 text-sm text-white/60">
            Empty for now.
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [activePanel, setActivePanel] = React.useState<Panel | null>(null);
  const openPanel = (panel: Panel) => setActivePanel((current) => (current === panel ? null : panel));
  const closePanel = () => setActivePanel(null);

  return (
    <div className="app bg-ink text-white">
      <div className="flex h-full min-h-0 flex-col px-3 pt-[max(4px,env(safe-area-inset-top))] pb-[max(92px,env(safe-area-inset-bottom))] sm:px-4 sm:pt-2">
        <header className="shrink-0">
          <HUD section="top" />
        </header>

        <main className="game-area min-h-0">
          <Game />
        </main>
      </div>

      <nav className="fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-1rem)] max-w-xl -translate-x-1/2">
        <div className="rounded-[26px] border border-white/10 bg-[#0b141dd9] p-2 shadow-[0_22px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-2">
            <NavButton active={activePanel === 'upgrade'} label="Upgrade" onClick={() => openPanel('upgrade')} />
            <NavButton active={activePanel === 'auto'} label="Auto" onClick={() => openPanel('auto')} />
            <NavButton active={activePanel === 'room'} label="Room" onClick={() => openPanel('room')} />
            <NavButton active={activePanel === 'homies'} label="Homies" onClick={() => openPanel('homies')} />
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 transition ${activePanel ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!activePanel}
      >
        <button
          type="button"
          onClick={closePanel}
          className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity ${activePanel ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close drawer overlay"
        />

        <section
          className={`absolute bottom-0 left-1/2 w-[calc(100%-0.75rem)] max-w-2xl -translate-x-1/2 rounded-t-[30px] border border-white/10 bg-[#08111f] shadow-[0_-24px_70px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
            activePanel ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="max-h-[70dvh] overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-5">
            {activePanel ? <DrawerContent panel={activePanel} onClose={closePanel} /> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
