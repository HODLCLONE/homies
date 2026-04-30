import * as Phaser from 'phaser';
import { HodlScene } from './HodlScene';
import type { GameState } from '../store/store';

type RoomLevel = GameState['roomLevel'];

type CreateGameOptions = {
  parent: HTMLElement;
  roomLevel: RoomLevel;
  onTap: () => void;
};

export type HomiesGame = {
  game: Phaser.Game;
  scene: HodlScene;
  resize: () => void;
  destroy: () => void;
};

export function createHomiesGame({ parent, roomLevel, onTap }: CreateGameOptions): HomiesGame {
  const scene = new HodlScene({ initialRoomLevel: roomLevel, onTap });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#07101d',
    scale: {
      mode: Phaser.Scale.NONE,
      width: Math.max(1, parent.clientWidth),
      height: Math.max(1, parent.clientHeight),
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    scene: [scene],
  });

  const resize = () => {
    game.scale.resize(Math.max(1, Math.floor(parent.clientWidth)), Math.max(1, Math.floor(parent.clientHeight)));
  };

  return {
    game,
    scene,
    resize,
    destroy: () => game.destroy(true),
  };
}
