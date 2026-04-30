import { useEffect, useRef } from 'react';
import { createHomiesGame, type HomiesGame } from '../game/Game';
import type { GameState } from '../store/store';

type GameCanvasProps = {
  roomLevel: GameState['roomLevel'];
  onTap: () => void;
};

export default function GameCanvas({ roomLevel, onTap }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<HomiesGame | null>(null);
  const onTapRef = useRef(onTap);
  const roomLevelRef = useRef(roomLevel);

  onTapRef.current = onTap;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || gameRef.current) return;

    roomLevelRef.current = roomLevel;
    const homiesGame = createHomiesGame({
      parent: host,
      roomLevel,
      onTap: () => onTapRef.current(),
    });
    gameRef.current = homiesGame;

    const resizeObserver = new ResizeObserver(() => homiesGame.resize());
    resizeObserver.observe(host);
    homiesGame.resize();

    return () => {
      resizeObserver.disconnect();
      homiesGame.destroy();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!gameRef.current) return;
    if (roomLevelRef.current === roomLevel) return;
    roomLevelRef.current = roomLevel;
    gameRef.current.scene.setRoomLevel(roomLevel);
  }, [roomLevel]);

  return <div ref={hostRef} className="game-canvas" aria-label="Homies game canvas" />;
}
