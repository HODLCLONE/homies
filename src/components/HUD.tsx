import { useGameStore } from '../store/useGameStore';

const format = (value: number) => new Intl.NumberFormat('en-US').format(value);
const ROOM_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 5,
  2: 10,
  3: 20,
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-[#0b141d] px-2.5 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-white/50">{label}</span>
      <span className="mt-1 block truncate text-[13px] font-black leading-none text-white sm:text-[14px]">{value}</span>
    </div>
  );
}

export default function HUD({ section }: { section: 'top' | 'bottom' }) {
  const state = useGameStore((s) => s);
  const capacity = ROOM_CAPACITY_BY_LEVEL[state.roomLevel] ?? ROOM_CAPACITY_BY_LEVEL[3];

  if (section !== 'top') return null;

  return (
    <div className="mx-auto w-full max-w-6xl rounded-[20px] border border-white/10 bg-[#0b141d]/90 px-2.5 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-md sm:px-3">
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        <StatCard label="Coins" value={format(state.coins)} />
        <StatCard label="Taps" value={format(state.taps)} />
        <StatCard label="Click Power" value={`x${state.clickPower}`} />
        <StatCard label="Room Lv" value={`${state.roomLevel}`} />
        <StatCard label="Capacity" value={`0 / ${capacity}`} />
      </div>
    </div>
  );
}
