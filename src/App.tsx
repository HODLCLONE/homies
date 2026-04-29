import Game from './game/Game';
import HUD from './components/HUD';

export default function App() {
  return (
    <div className="min-h-[100dvh] bg-ink text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col gap-3 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))] sm:px-6 sm:py-6">
        <HUD section="top" />
        <Game />
        <HUD section="bottom" />
      </div>
    </div>
  );
}
