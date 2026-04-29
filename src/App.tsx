import Game from './game/Game';
import HUD from './components/HUD';

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink text-white">
      <Game />
      <HUD />
    </div>
  );
}
