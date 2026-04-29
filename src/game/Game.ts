import * as React from 'react';
import * as Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import { useGameStore } from '../store/useGameStore';

const { useEffect, useRef } = React;

export default function Game(): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainScene | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const roomLevel = useGameStore((state) => state.roomLevel);
  const roomLevelRef = useRef(roomLevel);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;

    const host = hostRef.current;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      backgroundColor: '#08111f',
      scale: {
        mode: Phaser.Scale.NONE,
        width: host.clientWidth || window.innerWidth,
        height: host.clientHeight || window.innerHeight,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
      scene: [MainScene],
    });

    gameRef.current = game;
    sceneRef.current = game.scene.getScene('MainScene') as MainScene;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !gameRef.current) return;
      const { width, height } = entry.contentRect;
      gameRef.current.scale.resize(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
    });
    resizeObserverRef.current.observe(host);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      sceneRef.current = null;
      gameRef.current = null;
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (roomLevelRef.current === roomLevel) return;
    roomLevelRef.current = roomLevel;
    sceneRef.current.updateRoomLevel(roomLevel);
  }, [roomLevel]);

  return React.createElement('div', {
    ref: hostRef,
    className: 'game-area relative flex-1 min-h-0 w-full overflow-hidden rounded-none border-0 bg-transparent shadow-none',
  });
}
