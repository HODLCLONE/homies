import { claimBoost, upgradeClickPower, useGameStore } from '../store/useGameStore';

const format = (value: number) => new Intl.NumberFormat('en-US').format(value);

type HUDSection = 'top' | 'bottom';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-md">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">{label}</span>
      <span className="block text-xl font-black leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-2xl">
        {value}
      </span>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
      <span className="text-white/55">{label}</span> <span className="text-amber-100">{value}</span>
    </div>
  );
}

function ActionButton({
  title,
  subtitle,
  image,
  accent,
  onClick,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  image: string;
  accent: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex min-h-[96px] items-stretch overflow-hidden rounded-[26px] border border-white/10 bg-[#0b1425]/85 text-left shadow-soft transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} />
      <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-4 pr-2">
        <span className="text-xs font-black uppercase tracking-[0.32em] text-white/85 sm:text-sm">{title}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/78">{subtitle}</span>
      </div>
      <div className="relative flex w-28 items-center justify-center border-l border-white/10 bg-white/5 px-2 sm:w-32">
        <img src={image} alt="" className="h-full w-full object-contain opacity-90" draggable={false} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/15 opacity-80" />
    </button>
  );
}

export default function HUD({ section }: { section: HUDSection }) {
  const state = useGameStore((s) => s);
  const upgradeCost = Math.max(25, 25 + (state.clickPower - 1) * 10);
  const boostGain = Math.max(8, state.clickPower * 4);
  const canUpgrade = state.coins >= upgradeCost;

  if (section === 'top') {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1425]/75 shadow-soft backdrop-blur-xl">
          <img
            src="/assets/ui/ui_topbar_currencies.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-85"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25" />
          <div className="relative z-10 grid grid-cols-2 gap-2 px-3 py-3 sm:px-4 sm:py-4 md:grid-cols-4">
            <StatCard label="Coins" value={format(state.coins)} />
            <StatCard label="Taps" value={format(state.taps)} />
            <StatCard label="Click Power" value={`x${state.clickPower}`} />
            <StatCard label="Room" value={`Lv ${state.roomLevel}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1425]/78 p-4 shadow-soft backdrop-blur-xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/70">Homies</p>
            <p className="mt-1 text-sm font-medium text-white/75">Room 1</p>
          </div>
          <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Fully interactive
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/82 sm:text-[15px]">
          Tap the homie to earn coins. Upgrade to hit harder. Everything is tuned for one-hand mobile play.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MetaChip label="Click Power" value={`x${state.clickPower}`} />
          <MetaChip label="Boost" value={`+${boostGain}`} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <ActionButton
          title="Upgrade"
          subtitle={`Cost ${format(upgradeCost)} coins`}
          image="/assets/buttons/btn_upgrade.png"
          accent="bg-amber-400"
          onClick={upgradeClickPower}
          disabled={!canUpgrade}
        />
        <ActionButton
          title="Boost"
          subtitle={`Gain +${format(boostGain)} coins`}
          image="/assets/buttons/btn_boost.png"
          accent="bg-fuchsia-500"
          onClick={claimBoost}
        />
      </div>
    </div>
  );
}
