import { claimBoost, upgradeClickPower, useGameStore } from '../store/useGameStore';

const format = (value: number) => new Intl.NumberFormat('en-US').format(value);

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/65">{label}</span>
      <span className="text-2xl font-black leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">{value}</span>
    </div>
  );
}

function ActionButton({
  title,
  subtitle,
  image,
  onClick,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  image: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative h-20 w-full overflow-hidden rounded-2xl border border-white/10 text-left shadow-soft transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/20" />
      <div className="relative z-10 flex h-full flex-col justify-center px-5">
        <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {title}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100/80">{subtitle}</span>
      </div>
    </button>
  );
}

export default function HUD() {
  const state = useGameStore((s) => s);
  const upgradeCost = Math.max(25, 25 + (state.clickPower - 1) * 10);
  const boostGain = Math.max(8, state.clickPower * 4);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="pointer-events-auto relative mx-auto w-full max-w-4xl">
          <img
            src="/assets/ui/ui_topbar_currencies.png"
            alt=""
            className="h-24 w-full select-none object-contain sm:h-28"
            draggable={false}
          />
          <div className="absolute inset-0 flex items-center justify-between gap-4 px-6 sm:px-10">
            <StatCard label="Coins" value={format(state.coins)} />
            <StatCard label="Taps" value={format(state.taps)} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-3 sm:grid-cols-[1.2fr_1fr] sm:items-end">
        <div className="pointer-events-auto relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1425]/75 p-4 shadow-soft backdrop-blur-xl sm:p-5">
          <img
            src="/assets/ui/ui_player_panel.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-55"
            draggable={false}
          />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/70">Homies</p>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-200/85">Room 1</p>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/80 sm:text-[15px]">
              Tap the homie to earn coins. Upgrade to hit harder. The room is fully interactive.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/65">
              <span>Click Power x{state.clickPower}</span>
              <span>Boost +{boostGain}</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto grid gap-3 sm:grid-cols-2">
          <ActionButton
            title="Upgrade"
            subtitle={`Cost ${format(upgradeCost)} coins`}
            image="/assets/buttons/btn_upgrade.png"
            onClick={upgradeClickPower}
          />
          <ActionButton
            title="Boost"
            subtitle={`Gain +${format(boostGain)} coins`}
            image="/assets/buttons/btn_boost.png"
            onClick={claimBoost}
          />
        </div>
      </div>
    </div>
  );
}
