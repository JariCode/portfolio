import { SPRITE_BASE, sprite } from './sprites.js';

// Kerättävät tehostimet. Ase ja kilpi ovat Void Pickups -paketista; energialle ja pommille
// paketissa ei ole kuvaa, joten ne piirretään koodilla samaan 32 px:n pikselityyliin.
// Tehostin pysyy kartalla paikallaan ja keinuu hieman, jotta se erottuu kivistä.

export const PICKUP_TYPES = {
  ase: { key: 'tehostin-ase-iso', label: 'Ase' },
  kilpi: { key: 'tehostin-kilpi', label: 'Kilpi' },
  energia: { key: 'sd-energia', label: 'Runko +2' },
  pommi: { key: 'sd-pommi', label: 'Pommi +1' },
};

const COLLECT_RADIUS = 60;

export function preloadPickups(scene) {
  for (const key of ['tehostin-ase-iso', 'tehostin-kilpi']) {
    const s = sprite(key);
    scene.load.spritesheet(key, SPRITE_BASE + s.file, { frameWidth: s.w, frameHeight: s.h });
  }
}

// Energian ja pommin kuvat piirretään kerran tekstuureiksi (32 × 32, suurennetaan 2x)
function drawIcons(scene) {
  if (!scene.textures.exists('sd-energia')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // Kuusikulmainen kehys ja valkoinen risti
    g.fillStyle(0x000000, 1);
    g.fillPoints([{ x: 16, y: 2 }, { x: 29, y: 9 }, { x: 29, y: 23 }, { x: 16, y: 30 }, { x: 3, y: 23 }, { x: 3, y: 9 }], true);
    g.fillStyle(0xfb6b1d, 1);
    g.fillPoints([{ x: 16, y: 4 }, { x: 27, y: 10 }, { x: 27, y: 22 }, { x: 16, y: 28 }, { x: 5, y: 22 }, { x: 5, y: 10 }], true);
    g.fillStyle(0xf9c22b, 1);
    g.fillPoints([{ x: 16, y: 6 }, { x: 25, y: 11 }, { x: 25, y: 16 }, { x: 7, y: 16 }, { x: 7, y: 11 }], true);
    g.fillStyle(0x000000, 1);
    g.fillRect(12, 9, 8, 14);
    g.fillRect(9, 12, 14, 8);
    g.fillStyle(0xffffff, 1);
    g.fillRect(14, 10, 4, 12);
    g.fillRect(10, 14, 12, 4);
    g.generateTexture('sd-energia', 32, 32);
    g.destroy();
  }
  if (!scene.textures.exists('sd-pommi')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // Pyöreä pommi, meripihkainen vyö ja sytytyslanka
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 18, 12);
    g.fillStyle(0x3e3546, 1);
    g.fillCircle(16, 18, 10);
    g.fillStyle(0x625565, 1);
    g.fillCircle(13, 15, 5);
    g.fillStyle(0x9babb2, 1);
    g.fillRect(11, 12, 3, 3);
    g.fillStyle(0xf9c22b, 1);
    g.fillRect(6, 18, 20, 3);
    g.fillStyle(0x000000, 1);
    g.fillRect(14, 4, 4, 5);
    g.fillStyle(0x7f708a, 1);
    g.fillRect(15, 5, 2, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(17, 2, 2, 2);
    g.fillStyle(0xfb6b1d, 1);
    g.fillRect(19, 1, 2, 2);
    g.generateTexture('sd-pommi', 32, 32);
    g.destroy();
  }
}

export function createPickupAnims(scene) {
  drawIcons(scene);
  for (const key of ['tehostin-ase-iso', 'tehostin-kilpi']) {
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
  }
}

export class Pickup {
  constructor(scene, type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.t = Math.random() * 3;
    const def = PICKUP_TYPES[type];
    // Meripihkainen rengas taustalla tekee tehostimesta helposti huomattavan
    this.ring = scene.add.circle(x, y, 30).setStrokeStyle(3, 0xffb547, 0.8).setDepth(3);
    this.icon = scene.add.sprite(x, y, def.key).setScale(2).setDepth(3);
    if (def.key.startsWith('tehostin-')) this.icon.play(def.key);
  }

  update(dt) {
    this.t += dt;
    const bob = Math.sin(this.t * 3) * 5;
    this.icon.setPosition(this.x, this.y + bob);
    this.ring.setPosition(this.x, this.y + bob).setScale(1 + Math.sin(this.t * 4) * 0.08);
  }

  near(x, y) {
    return Math.hypot(x - this.x, y - this.y) < COLLECT_RADIUS;
  }

  destroy() {
    this.icon.destroy();
    this.ring.destroy();
  }
}