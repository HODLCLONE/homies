import * as Phaser from 'phaser';
import { getGameState, tapHomie } from '../store/store';

type RoomLevel = 1 | 2 | 3;

type HodlSceneOptions = {
  initialRoomLevel: RoomLevel;
  onTap: () => void;
};

const ASSET_ROOT = '/assets/HODL_FINAL_HERMES_ASSETS';

const ORBIT_ICONS = ['🤖', '💜', '🔁', '🔵', '📱', '🧠', '⛏️', '🐸', '🏦', '🟣'];

export class HodlScene extends Phaser.Scene {
  private roomLevel: RoomLevel;
  private onTap: () => void;
  private homie?: Phaser.GameObjects.Image;
  private homieHitZone?: Phaser.GameObjects.Zone;
  private orbiters: Phaser.GameObjects.Text[] = [];
  private homieBaseScale = 1;
  private orbitTick = 0;

  constructor(options: HodlSceneOptions) {
    super('HodlScene');
    this.roomLevel = options.initialRoomLevel;
    this.onTap = options.onTap;
  }

  preload() {
    this.load.image('homie-player-idle', `${ASSET_ROOT}/character/homie_player_idle.png`);
    this.load.image('fx-tap-ring', `${ASSET_ROOT}/effects/fx_tap_ring.png`);
    this.load.image('fx-coin-pop', `${ASSET_ROOT}/effects/fx_coin_pop.png`);
  }

  create() {
    this.cameras.main.setBackgroundColor('#070017');
    this.addGlowBackdrop();

    this.homie = this.add.image(0, 0, 'homie-player-idle').setOrigin(0.5).setDepth(8);
    this.homieHitZone = this.add.zone(0, 0, 1, 1).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.homieHitZone.on(Phaser.Input.Events.POINTER_DOWN, this.handleHomieTap, this);

    ORBIT_ICONS.forEach((icon, index) => {
      const orbiter = this.add.text(0, 0, icon, {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
        fontSize: '30px',
      }).setOrigin(0.5).setDepth(5).setAlpha(index < 5 ? 0.95 : 0.7);
      this.orbiters.push(orbiter);
    });

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });

    this.layout();
  }

  update(_time: number, delta: number) {
    this.orbitTick += delta * 0.00042;
    this.layoutOrbiters();
  }

  setRoomLevel(roomLevel: RoomLevel) {
    this.roomLevel = roomLevel;
    this.layout();
  }

  private addGlowBackdrop() {
    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    const rings = [
      { r: 250, c: 0x5a24ff, a: 0.12, y: 0.42 },
      { r: 170, c: 0x8a5cff, a: 0.1, y: 0.48 },
      { r: 90, c: 0x20103f, a: 0.7, y: 0.5 },
    ];
    rings.forEach((ring) => {
      const circle = this.add.circle(width / 2, height * ring.y, ring.r, ring.c, ring.a).setDepth(0);
      circle.setBlendMode(Phaser.BlendModes.ADD);
    });
  }

  private handleHomieTap(pointer: Phaser.Input.Pointer) {
    const state = tapHomie();
    this.onTap();
    this.spawnTapEffects(pointer.worldX, pointer.worldY, state.lastTapAmount);
    this.pulseHomie();
  }

  private layout() {
    if (!this.homie || !this.homieHitZone) return;

    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    const frame = this.textures.getFrame('homie-player-idle');
    const target = Math.min(width * 0.46, height * 0.31);
    const scale = Phaser.Math.Clamp(target / Math.max(frame.width, frame.height), 0.42, 0.82);
    const centerX = width / 2;
    const centerY = height * 0.5;

    this.homieBaseScale = scale;
    this.homie.setScale(scale);
    this.homie.setPosition(centerX, centerY);
    this.homieHitZone.setPosition(centerX, centerY);
    this.homieHitZone.setSize(frame.width * scale * 0.9, frame.height * scale * 0.9);
    this.layoutOrbiters();
  }

  private layoutOrbiters() {
    if (!this.homie) return;
    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    const centerX = width / 2;
    const centerY = height * 0.5;
    const ownedTotal = Object.values(getGameState().owned).reduce((sum, count) => sum + count, 0);
    const visible = Phaser.Math.Clamp(Math.max(5, Math.ceil(ownedTotal / 4)), 5, this.orbiters.length);

    this.orbiters.forEach((orbiter, index) => {
      const radius = Math.min(width * (0.27 + (index % 3) * 0.055), height * (0.22 + (index % 3) * 0.035));
      const angle = this.orbitTick + index * ((Math.PI * 2) / this.orbiters.length);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.8;
      orbiter.setVisible(index < visible);
      orbiter.setPosition(x, y);
      orbiter.setScale(0.82 + Math.sin(angle * 2) * 0.08);
      orbiter.setAlpha(index < visible ? 0.95 : 0);
    });
  }

  private spawnTapEffects(x: number, y: number, amount: number) {
    const ring = this.add.image(x, y, 'fx-tap-ring').setDepth(30).setScale(0.3).setAlpha(0.82);
    const coin = this.add.image(x + 18, y - 12, 'fx-coin-pop').setDepth(31).setScale(0.24);
    const label = this.add.text(x, y - 42, `+${formatCompact(amount)}`, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '900',
      color: '#ffe991',
      stroke: '#16002f',
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
