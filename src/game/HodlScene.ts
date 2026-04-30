import * as Phaser from 'phaser';
import { tapHomie } from '../store/store';

type RoomLevel = 1 | 2 | 3;
type SlotMap = Record<string, [number, number][]>;

type HodlSceneOptions = {
  initialRoomLevel: RoomLevel;
  onTap: () => void;
};

const ASSET_ROOT = '/assets/HODL_FINAL_HERMES_ASSETS';
const ROOM_TEXTURES: Record<RoomLevel, { key: string; path: string; slotsKey: string }> = {
  1: { key: 'room-level-1', path: `${ASSET_ROOT}/rooms/room_lvl_1_starter.png`, slotsKey: 'room_lvl_1_starter' },
  2: { key: 'room-level-2', path: `${ASSET_ROOT}/rooms/room_lvl_2_expanded.png`, slotsKey: 'room_lvl_2_expanded' },
  3: { key: 'room-level-3', path: `${ASSET_ROOT}/rooms/room_lvl_3_hq.png`, slotsKey: 'room_lvl_3_hq' },
};

const SLOT_COUNT: Record<RoomLevel, number> = {
  1: 5,
  2: 10,
  3: 20,
};

const ROOM_FIT = {
  width: 0.94,
  height: 0.76,
  centerY: 0.49,
} as const;

const HOMIE_FIT = {
  x: 0.5,
  floorY: 0.84,
  roomScaleFactor: 0.62,
  minScale: 0.28,
  maxScale: 0.44,
} as const;

export class HodlScene extends Phaser.Scene {
  private roomLevel: RoomLevel;
  private onTap: () => void;
  private room?: Phaser.GameObjects.Image;
  private homie?: Phaser.GameObjects.Image;
  private homieHitZone?: Phaser.GameObjects.Zone;
  private slotSprites: Phaser.GameObjects.Image[] = [];
  private slotMap: SlotMap = {};
  private roomBounds = new Phaser.Geom.Rectangle(0, 0, 1, 1);
  private homieBaseScale = 1;

  constructor(options: HodlSceneOptions) {
    super('HodlScene');
    this.roomLevel = options.initialRoomLevel;
    this.onTap = options.onTap;
  }

  preload() {
    this.load.image(ROOM_TEXTURES[1].key, ROOM_TEXTURES[1].path);
    this.load.image(ROOM_TEXTURES[2].key, ROOM_TEXTURES[2].path);
    this.load.image(ROOM_TEXTURES[3].key, ROOM_TEXTURES[3].path);
    this.load.image('homie-player-idle', `${ASSET_ROOT}/character/homie_player_idle.png`);
    this.load.image('slot-empty', `${ASSET_ROOT}/slots/slot_empty.png`);
    this.load.image('fx-tap-ring', `${ASSET_ROOT}/effects/fx_tap_ring.png`);
    this.load.image('fx-coin-pop', `${ASSET_ROOT}/effects/fx_coin_pop.png`);
    this.load.json('slot-positions', `${ASSET_ROOT}/slot_positions.json`);
  }

  create() {
    this.cameras.main.setBackgroundColor('#07101d');
    this.slotMap = (this.cache.json.get('slot-positions') ?? {}) as SlotMap;

    this.room = this.add.image(0, 0, this.currentRoomTexture().key).setOrigin(0.5).setDepth(0);
    this.homie = this.add.image(0, 0, 'homie-player-idle').setOrigin(0.5, 1).setDepth(5);
    this.homieHitZone = this.add.zone(0, 0, 1, 1).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    this.homieHitZone.on(Phaser.Input.Events.POINTER_DOWN, this.handleHomieTap, this);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });

    this.layout();
  }

  setRoomLevel(roomLevel: RoomLevel) {
    if (this.roomLevel === roomLevel && this.room) return;
    this.roomLevel = roomLevel;
    if (this.room) this.layout();
  }

  private currentRoomTexture() {
    return ROOM_TEXTURES[this.roomLevel];
  }

  private handleHomieTap(pointer: Phaser.Input.Pointer) {
    const state = tapHomie();
    this.onTap();
    this.spawnTapEffects(pointer.worldX, pointer.worldY, state.lastTapAmount);
    this.pulseHomie();
  }

  private layout() {
    if (!this.room || !this.homie || !this.homieHitZone) return;

    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    const roomTexture = this.currentRoomTexture();
    const roomFrame = this.textures.getFrame(roomTexture.key);
    const roomScale = Math.min((width * ROOM_FIT.width) / roomFrame.width, (height * ROOM_FIT.height) / roomFrame.height);
    const roomWidth = roomFrame.width * roomScale;
    const roomHeight = roomFrame.height * roomScale;
    const roomX = width / 2;
    const roomY = height * ROOM_FIT.centerY;
    const roomLeft = roomX - roomWidth / 2;
    const roomTop = roomY - roomHeight / 2;

    this.room.setTexture(roomTexture.key);
    this.room.setPosition(roomX, roomY);
    this.room.setDisplaySize(roomWidth, roomHeight);
    this.roomBounds.setTo(roomLeft, roomTop, roomWidth, roomHeight);

    this.renderSlots(roomTexture.slotsKey);
    this.layoutHomie(roomScale, roomLeft, roomTop, roomWidth, roomHeight);
  }

  private renderSlots(slotsKey: string) {
    const positions = (this.slotMap[slotsKey] ?? []).slice(0, SLOT_COUNT[this.roomLevel]);

    while (this.slotSprites.length < positions.length) {
      this.slotSprites.push(this.add.image(0, 0, 'slot-empty').setOrigin(0.5).setDepth(2).setAlpha(0.9));
    }

    this.slotSprites.forEach((slot, index) => {
      const position = positions[index];
      if (!position) {
        slot.setVisible(false);
        return;
      }

      const [xFactor, yFactor] = position;
      const slotScale = Phaser.Math.Clamp(this.roomBounds.width / 1800, 0.18, 0.36);
      slot.setVisible(true);
      slot.setScale(slotScale);
      slot.setPosition(this.roomBounds.left + this.roomBounds.width * xFactor, this.roomBounds.top + this.roomBounds.height * yFactor);
    });
  }

  private layoutHomie(roomScale: number, roomLeft: number, roomTop: number, roomWidth: number, roomHeight: number) {
    if (!this.homie || !this.homieHitZone) return;

    const homieScale = Phaser.Math.Clamp(roomScale * HOMIE_FIT.roomScaleFactor, HOMIE_FIT.minScale, HOMIE_FIT.maxScale);
    const homieX = roomLeft + roomWidth * HOMIE_FIT.x;
    const homieBottomY = Math.min(roomTop + roomHeight * HOMIE_FIT.floorY, this.scale.height - 12);
    const homieFrame = this.textures.getFrame('homie-player-idle');
    const hitWidth = homieFrame.width * homieScale * 0.72;
    const hitHeight = homieFrame.height * homieScale * 0.82;

    this.homieBaseScale = homieScale;
    this.homie.setScale(homieScale);
    this.homie.setPosition(homieX, homieBottomY);
    this.homieHitZone.setPosition(homieX, homieBottomY - hitHeight / 2);
    this.homieHitZone.setSize(hitWidth, hitHeight);
  }

  private spawnTapEffects(x: number, y: number, amount: number) {
    const ring = this.add.image(x, y, 'fx-tap-ring').setDepth(20).setScale(0.25).setAlpha(0.82);
    const coin = this.add.image(x + 14, y - 10, 'fx-coin-pop').setDepth(21).setScale(0.22);
    const label = this.add.text(x, y - 34, `+${amount}`, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#ffe58f',
      stroke: '#08111f',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(22);

    this.tweens.add({ targets: ring, scale: 0.62, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    this.tweens.add({ targets: [coin, label], y: '-=48', alpha: 0, duration: 650, ease: 'Cubic.easeOut', onComplete: () => { coin.destroy(); label.destroy(); } });
  }

  private pulseHomie() {
    if (!this.homie) return;
    this.tweens.killTweensOf(this.homie);
    this.homie.setScale(this.homieBaseScale);
    this.tweens.add({
      targets: this.homie,
      scaleX: this.homieBaseScale * 1.04,
      scaleY: this.homieBaseScale * 0.98,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => this.homie?.setScale(this.homieBaseScale),
    });
  }
}
