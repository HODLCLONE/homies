import * as Phaser from 'phaser';
import { tapHomie } from '../store/store';

type RoomLevel = 1 | 2 | 3;

type HodlSceneOptions = {
  initialRoomLevel: RoomLevel;
  onTap: () => void;
};

const ASSET_ROOT = '/assets/HODL_FINAL_HERMES_ASSETS';

export class HodlScene extends Phaser.Scene {
  private roomLevel: RoomLevel;
  private onTap: () => void;
  private roomBackground?: Phaser.GameObjects.Image;
  private homie?: Phaser.GameObjects.Image;
  private homieHitZone?: Phaser.GameObjects.Zone;
  private homieBaseScale = 1;

  constructor(options: HodlSceneOptions) {
    super('HodlScene');
    this.roomLevel = options.initialRoomLevel;
    this.onTap = options.onTap;
  }

  preload() {
    this.load.image('room-lvl-3-hq', `${ASSET_ROOT}/rooms/room_lvl_3_hq.png`);
    this.load.image('homie-player-idle', `${ASSET_ROOT}/character/homie_player_idle.png`);
    this.load.image('fx-tap-ring', `${ASSET_ROOT}/effects/fx_tap_ring.png`);
    this.load.image('fx-coin-pop', `${ASSET_ROOT}/effects/fx_coin_pop.png`);
  }

  create() {
    this.cameras.main.setBackgroundColor('#02060d');

    this.roomBackground = this.add.image(0, 0, 'room-lvl-3-hq').setOrigin(0.5).setDepth(1);
    this.homie = this.add.image(0, 0, 'homie-player-idle').setOrigin(0.5).setDepth(8);
    this.homieHitZone = this.add.zone(0, 0, 1, 1).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.homieHitZone.on(Phaser.Input.Events.POINTER_DOWN, this.handleHomieTap, this);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });

    this.layout();
  }

  setRoomLevel(roomLevel: RoomLevel) {
    this.roomLevel = roomLevel;
    this.layout();
  }

  private handleHomieTap(pointer: Phaser.Input.Pointer) {
    const state = tapHomie();
    this.onTap();
    this.spawnTapEffects(pointer.worldX, pointer.worldY, state.lastTapAmount);
    this.pulseHomie();
  }

  private layout() {
    if (!this.roomBackground || !this.homie || !this.homieHitZone) return;

    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    const roomFrame = this.textures.getFrame('room-lvl-3-hq');
    const roomScale = Math.max(width / roomFrame.width, height / roomFrame.height) * 1.16;
    const frame = this.textures.getFrame('homie-player-idle');
    const target = Math.min(width * 0.62, height * 0.42);
    const scale = Phaser.Math.Clamp(target / Math.max(frame.width, frame.height), 0.54, 1);
    const centerX = width / 2;
    const centerY = height * 0.5;

    this.roomBackground.setScale(roomScale);
    this.roomBackground.setPosition(centerX + width * 0.18, height * 0.39);
    this.homieBaseScale = scale;
    this.homie.setScale(scale);
    this.homie.setPosition(centerX, centerY);
    this.homieHitZone.setPosition(centerX, centerY);
    this.homieHitZone.setSize(frame.width * scale * 0.9, frame.height * scale * 0.9);
  }

  private spawnTapEffects(x: number, y: number, amount: number) {
    const ring = this.add.image(x, y, 'fx-tap-ring').setDepth(30).setScale(0.3).setAlpha(0.82);
    const coin = this.add.image(x + 18, y - 12, 'fx-coin-pop').setDepth(31).setScale(0.24);
    const label = this.add.text(x, y - 42, `+${formatCompact(amount)}`, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '900',
      color: '#7ee7ff',
      stroke: '#02060d',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(32);

    this.tweens.add({ targets: ring, scale: 0.88, alpha: 0, duration: 430, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    this.tweens.add({ targets: [coin, label], y: '-=58', alpha: 0, duration: 720, ease: 'Cubic.easeOut', onComplete: () => { coin.destroy(); label.destroy(); } });
  }

  private pulseHomie() {
    if (!this.homie) return;
    this.tweens.killTweensOf(this.homie);
    this.homie.setScale(this.homieBaseScale);
    this.tweens.add({
      targets: this.homie,
      scaleX: this.homieBaseScale * 1.08,
      scaleY: this.homieBaseScale * 0.94,
      duration: 85,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => this.homie?.setScale(this.homieBaseScale),
    });
  }
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}
