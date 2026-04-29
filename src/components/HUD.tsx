import { claimBoost, upgradeClickPower, useGameStore } from '../store/useGameStore';

const format = (value: number) => new Intl.NumberFormat('en-US').format(value);
const ROOM_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 5,
  2: 10,
  3: 20,
};

type HUDSection = 'top' | 'bottom';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat rounded-2xl border border-white/10 bg-[#0b141d] px-3 py-2.5">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">{label}</span>
      <span className="block text-lg font-black leading-none text-white sm:text-xl">{value}</span>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-[#0b141d] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
      <span className="text-white/55">{label}</span> <span className="text-lime-100">{value}</span>
    </div>
  );
}

function ActionButton({
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
      ? 'border-lime-300/40 text-lime-200 hover:border-lime-200/55 hover:bg-lime-300/10'
      : 'border-yellow-300/40 text-yellow-100 hover:border-yellow-200/55 hover:bg-yellow-300/10';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-h-[92px] items-center justify-between gap-4 rounded-[22px] border bg-[#0b141d] px-4 py-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 ${accentClasses}`}
    >
      <div className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-[0.32em] text-white sm:text-sm">{title}</span>
        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">{subtitle}</span>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg font-black text-white">
        {title === 'Upgrade' ? '↗' : '⚡'}
      </div>
    </button>
  );
}

export default function HUD({ section }: { section: HUDSection }) {
  const state = useGameStore((s) => s);
  const upgradeCost = Math.max(25, 25 + (state.clickPower - 1) * 10);
  const boostGain = Math.max(8, state.clickPower * 4);
  const canUpgrade = state.coins >= upgradeCost;
  const capacity = ROOM_CAPACITY_BY_LEVEL[state.roomLevel] ?? ROOM_CAPACITY_BY_LEVEL[3];
  const roomCapacityText = `0 / ${capacity} Homies`;

  if (section === 'top') {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="hero grid grid-cols-2 gap-2 md:grid-cols-5">
          <StatCard label="Coins" value={format(state.coins)} />
          <StatCard label="Taps" value={format(state.taps)} />
          <StatCard label="Click Power" value={`x${state.clickPower}`} />
          <StatCard label="Room" value={`Lv ${state.roomLevel}`} />
          <StatCard label="Capacity" value={roomCapacityText} />
        </div>
      </div>
    );
  }

  return (
    <div className="stats mx-auto grid w-full max-w-6xl gap-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="rounded-[24px] border border-white/10 bg-[#0b141d] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/70">Homies</p>
            <p className="mt-1 text-sm font-medium text-white/72">Room 1</p>
          </div>
          <div className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-lime-200">
            Fully interactive
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/82 sm:text-[15px]">
          Tap the homie to earn coins. Upgrade to hit harder. Everything is tuned for one-hand mobile play.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MetaChip label="Click Power" value={`x${state.clickPower}`} />
          <MetaChip label="Boost" value={`+${boostGain}`} />
          <MetaChip label="Room Capacity" value={roomCapacityText} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <ActionButton
          title="Upgrade"
          subtitle={`Cost ${format(upgradeCost)} coins`}
          accent="lime"
          onClick={upgradeClickPower}
          disabled={!canUpgrade}
        />
        <ActionButton title="Boost" subtitle={`Gain +${format(boostGain)} coins`} accent="yellow" onClick={claimBoost} />
      </div>
    </div>
  );
}
