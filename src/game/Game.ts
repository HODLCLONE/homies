import * as React from 'react';
import * as Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const { useEffect, useRef } = React;

export default function Game(): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      backgroundColor: '#08111f',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: hostRef.current.clientWidth || window.innerWidth,
        height: hostRef.current.clientHeight || window.innerHeight,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
      scene: [MainScene],
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return React.createElement('div', {
    ref: hostRef,
    className: 'absolute inset-0',
  });
}
