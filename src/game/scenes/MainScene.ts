import * as Phaser from 'phaser';
import { tapCharacter } from '../../store/useGameStore';

type LayoutState = {
  roomX: number;
  roomY: number;
  roomLeft: number;
  roomTop: number;
  roomWidth: number;
  roomHeight: number;
  roomScale: number;
  homieBounds: Phaser.Geom.Rectangle | null;
};

export default class MainScene extends Phaser.Scene {
  private roomLevel = 1;
  private room!: Phaser.GameObjects.Image;
  private homie!: Phaser.GameObjects.Image;
  private homieHitZone!: Phaser.GameObjects.Rectangle;
  private homieBaseScale = 1;
  private layoutState: LayoutState = {
    roomX: 0,
    roomY: 0,
    roomLeft: 0,
    roomTop: 0,
    roomWidth: 0,
    roomHeight: 0,
    roomScale: 1,
    homieBounds: null,
  };

  private onGlobalPointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!this.layoutState.homieBounds) return;

    const { worldX, worldY } = pointer;
    if (Phaser.Geom.Rectangle.Contains(this.layoutState.homieBounds, worldX, worldY)) {
      this.handleHomieTap(worldX, worldY);
    }
  };

  private onResize = () => {
    this.layout();
  };

  preload() {
    this.load.image('room_lvl_1_starter', '/assets/rooms/room_lvl_1_starter.png');
    this.load.image('homie_player_idle', '/assets/character/homie_player_idle.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#08111f');

    this.room = this.add.image(0, 0, 'room_lvl_1_starter').setOrigin(0.5);
    this.room.setDepth(0);

    this.homie = this.add.image(0, 0, 'homie_player_idle').setOrigin(0.5, 1);
    this.homie.setDepth(3);

    this.homieHitZone = this.add.rectangle(0, 0, 1, 1, 0x000000, 0).setOrigin(0.5);
    this.homieHitZone.setDepth(4);
    this.homieHitZone.setInteractive({ useHandCursor: true });

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onGlobalPointerDown);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    this.layout();
  }

  updateRoomLevel(roomLevel: number) {
    if (roomLevel === this.roomLevel) return;
    this.roomLevel = roomLevel;
    this.layout();
  }

  private shutdown() {
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onGlobalPointerDown);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
  }

  private handleHomieTap(x: number, y: number) {
    const state = tapCharacter();
    const amount = state.lastTapAmount;

    this.spawnTapEffect(x, y, amount);
    this.pulseHomie();
  }

  private spawnTapEffect(x: number, y: number, amount: number) {
    const text = this.add.text(x, y, `+${amount}`, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '700',
      color: '#f8d57b',
      stroke: '#09111f',
      strokeThickness: 6,
    });
    text.setOrigin(0.5);
    text.setDepth(10);

    const glow = this.add.circle(x, y, 18, 0xf8d57b, 0.22).setDepth(9);

    this.tweens.add({
      targets: [text, glow],
      y: y - 46,
      alpha: { from: 1, to: 0 },
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy();
        glow.destroy();
      },
    });
  }

  private pulseHomie() {
    this.tweens.killTweensOf(this.homie);
    this.homie.setScale(this.homieBaseScale);

    this.tweens.add({
      targets: this.homie,
      scaleX: this.homieBaseScale * 1.04,
      scaleY: this.homieBaseScale * 0.98,
      yoyo: true,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.homie.setScale(this.homieBaseScale);
      },
    });
  }

  private layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const roomFrame = this.textures.getFrame('room_lvl_1_starter');
    const homieFrame = this.textures.getFrame('homie_player_idle');

    const roomNaturalWidth = roomFrame.width;
    const roomNaturalHeight = roomFrame.height;
    const roomScale = Math.min((width * 0.95) / roomNaturalWidth, (height * 0.78) / roomNaturalHeight);
    const roomDisplayWidth = roomNaturalWidth * roomScale;
    const roomDisplayHeight = roomNaturalHeight * roomScale;

    const roomX = width / 2;
    const roomY = height * 0.54;
    const roomLeft = roomX - roomDisplayWidth / 2;
    const roomTop = roomY - roomDisplayHeight / 2;

    this.room.setPosition(roomX, roomY);
    this.room.setDisplaySize(roomDisplayWidth, roomDisplayHeight);

    const homieScale = 0.45;
    const homieDisplayWidth = homieFrame.width * homieScale;
    const homieDisplayHeight = homieFrame.height * homieScale;
    const homieX = width * 0.385;
    const homieBottomY = height * 0.755;

    this.homieBaseScale = homieScale;
    this.homie.setScale(homieScale);
    this.homie.setPosition(homieX, homieBottomY);

    this.homieHitZone.setPosition(homieX, homieBottomY - homieDisplayHeight / 2);
    this.homieHitZone.setSize(homieDisplayWidth * 0.82, homieDisplayHeight * 0.84);
    this.layoutState = {
      roomX,
      roomY,
      roomLeft,
      roomTop,
      roomWidth: roomDisplayWidth,
      roomHeight: roomDisplayHeight,
      roomScale,
      homieBounds: this.homie.getBounds(),
    };
  }
}
