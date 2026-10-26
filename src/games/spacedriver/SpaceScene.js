import * as Phaser from 'phaser';
import { SECTORS } from './sectors.js';
import { createStarfield } from './starfield.js';
import { createHitTest } from './obstacles.js';
import { PlayerShip, HITBOX, createPlayerAnims, preloadPlayer } from './player.js';
import { play } from './sound.js';

// Pelin sisäinen koko (3:4). Kartta on 12 laattaa × 64 px = 768 px leveä, joten kartan
// leveys mahtuu kuvaan ja kamera liikkuu vain pystysuunnassa.
export const GAME_W = 768;
export const GAME_H = 1024;
export const MAX_HP = 5;

// Kartta rullaa tällä nopeudella (px/s): 50 riviä × 64 px, josta ruudullinen näkyy heti,
// joten sektori kestää noin 40 s
const SCROLL_SPEED = 55;

// Aluksen liike (px/s). Sormella vedettäessä alus seuraa sormea, mutta enintään DRAG_SPEED-
// nopeudella, jotta se ei hyppää kiven läpi.
const SHIP_SPEED = 430;
const DRAG_SPEED = 1500;
const DRAG_FOLLOW = 18; // kuinka tiukasti alus seuraa sormea (suurempi = tiukemmin)

// Alus pysyy ruudulla: reunoista vähintään näin paljon tilaa (px)
const MARGIN_X = 36;
const MARGIN_TOP = 120; // HUD on yläreunassa
const MARGIN_BOTTOM = 60;

const BULLET_SPEED = 950;
const INVULNERABLE_MS = 1600; // osuman jälkeen hetki suojassa, ettei sama kivi osu heti uudelleen
const KNOCKBACK = 340; // osuma työntää alusta poispäin esteestä (px/s, vaimenee)

// Osuma-alueen reunapisteet: soikion kehältä 12 pistettä + keskipiste
const HIT_POINTS = [{ x: 0, y: 0 }].concat(
  Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: Math.cos(a) * HITBOX.rx, y: Math.sin(a) * HITBOX.ry };
  }),
);

// Uuden pelin lähtötiedot; myöhemmin sektorista toiseen siirtyvät energia ja pisteet
export const NEW_RUN = { hp: MAX_HP, score: 0 };

export default class SpaceScene extends Phaser.Scene {
  constructor() {
    super('space');
  }

  // data: { sector: sektorin järjestysnumero, carry: aiemmista sektoreista kertyneet tiedot }
  init(data) {
    this.sectorIndex = data?.sector ?? 0;
    this.sector = SECTORS[this.sectorIndex];
    this.carry = data?.carry ?? NEW_RUN;
  }

  preload() {
    const s = this.sector;
    this.load.tilemapTiledJSON(s.key, s.map);
    this.load.image(`tiles-${s.tileset.name}`, s.tileset.file);
    preloadPlayer(this);
  }

  create() {
    const s = this.sector;
    this.hp = this.carry.hp;
    this.score = this.carry.score;
    this.finished = false;
    this.invulnerableUntil = 0;
    this.knock = 0;
    this.elapsed = 0;

    this.updateStars = createStarfield(this, GAME_W, GAME_H);

    // ── Kartta: Tausta ja Esteet aluksen takana, Edusta edessä ──
    const map = this.make.tilemap({ key: s.key });
    const tiles = map.addTilesetImage(s.tileset.name, `tiles-${s.tileset.name}`);
    map.createLayer('Tausta', tiles).setDepth(1);
    const obstacles = map.createLayer('Esteet', tiles).setDepth(2);
    map.createLayer('Edusta', tiles).setDepth(6);
    this.isSolid = createHitTest(this, `tiles-${s.tileset.name}`, obstacles);
    this.mapH = map.heightInPixels;

    // Kamera alkaa kartan alareunasta ja nousee kohti yläreunaa
    const cam = this.cameras.main;
    cam.setBounds(0, 0, GAME_W, this.mapH);
    cam.scrollY = this.mapH - GAME_H;

    // ── Alus ──
    createPlayerAnims(this);
    this.ship = new PlayerShip(this, GAME_W / 2, cam.scrollY + GAME_H - 200);
    this.ship.setHp(this.hp);
    this.ship.sync();
    this.bullets = [];
    this.ship.onShot((x, y) => this.fire(x, y));

    // ── Näppäimet: nuolet ja WASD ──
    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');

    // ── Sormella vetäminen: alus liikkuu sormen liikkeen verran, ei hyppää sormen alle ──
    this.drag = null;
    this.input.on('pointerdown', (p) => {
      this.drag = { px: p.x, py: p.y, sx: this.ship.x, sy: this.ship.y - cam.scrollY, tx: null, ty: null };
    });
    this.input.on('pointermove', (p) => {
      if (!this.drag || !p.isDown) return;
      this.drag.tx = this.drag.sx + (p.x - this.drag.px);
      this.drag.ty = this.drag.sy + (p.y - this.drag.py);
    });
    const release = () => {
      this.drag = null;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.hudKey = '';
    this.emitHud();
  }

  // Ammus lähtee piipusta suoraan ylös. Ammukset liikutetaan itse (ei fysiikkamoottoria):
  // ne kulkevat suoraan, ja osuma kiveen tarkistetaan kuvan mukaan.
  fire(x, y) {
    if (this.finished) return;
    const b = this.add.sprite(x, y, 'pelaaja-ammus-tykki').setScale(2).setDepth(3).play('sd-ammus-tykki');
    this.bullets.push(b);
    play('shot', { volume: 0.25, gap: 0.1 });
  }

  // Pieni kipinä ammuksen osuessa kiveen
  spark(x, y) {
    const flash = this.add.circle(x, y, 10, 0xffd28a, 0.9).setDepth(5);
    this.tweens.add({ targets: flash, scale: 2.2, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.cameras.main;
    this.elapsed += dt;

    // ── Kartan rullaus: alus pysyy ruudulla samassa kohdassa, joten sitä siirretään samaa matkaa ──
    const before = cam.scrollY;
    if (!this.finished) cam.scrollY = Math.max(0, cam.scrollY - SCROLL_SPEED * dt);
    const scrolled = before - cam.scrollY;
    this.updateStars(cam.scrollY, this.elapsed);

    this.updateBullets(dt, cam);
    if (this.finished) return;

    this.ship.y -= scrolled;
    this.moveShip(dt, cam);
    this.checkObstacles(time);

    // Sektorin loppu: kartan yläreuna on ruudulla
    if (cam.scrollY <= 0) this.clearSector();

    this.emitHud();
  }

  moveShip(dt, cam) {
    const k = this.keys;
    let vx;
    let vy;
    if (this.drag && this.drag.tx !== null) {
      // Sormi: kohti kohdetta, nopeus kasvaa etäisyyden mukaan
      const tx = this.drag.tx;
      const ty = this.drag.ty + cam.scrollY;
      vx = Phaser.Math.Clamp((tx - this.ship.x) * DRAG_FOLLOW, -DRAG_SPEED, DRAG_SPEED);
      vy = Phaser.Math.Clamp((ty - this.ship.y) * DRAG_FOLLOW, -DRAG_SPEED, DRAG_SPEED);
    } else {
      const left = k.LEFT.isDown || k.A.isDown;
      const right = k.RIGHT.isDown || k.D.isDown;
      const up = k.UP.isDown || k.W.isDown;
      const down = k.DOWN.isDown || k.S.isDown;
      const dx = (right ? 1 : 0) - (left ? 1 : 0);
      const dy = (down ? 1 : 0) - (up ? 1 : 0);
      // Vinottain yhtä nopeasti kuin suoraan
      const len = Math.hypot(dx, dy) || 1;
      vx = (dx / len) * SHIP_SPEED;
      vy = (dy / len) * SHIP_SPEED;
    }
    this.ship.setBoost(vy < -40);

    // Osuman työntö vaimenee nopeasti
    vx += this.knock;
    this.knock *= Math.pow(0.02, dt);

    const minY = cam.scrollY + MARGIN_TOP;
    const maxY = cam.scrollY + GAME_H - MARGIN_BOTTOM;
    this.ship.x = Phaser.Math.Clamp(this.ship.x + vx * dt, MARGIN_X, GAME_W - MARGIN_X);
    this.ship.y = Phaser.Math.Clamp(this.ship.y + vy * dt, minY, maxY);
    this.ship.sync();
  }

  updateBullets(dt, cam) {
    this.bullets = this.bullets.filter((b) => {
      b.y -= BULLET_SPEED * dt;
      // Ammuksen kärki osuu kiveen: kipinä ja ammus pois
      if (this.isSolid(b.x, b.y - 12)) {
        this.spark(b.x, b.y - 12);
        b.destroy();
        return false;
      }
      if (b.y < cam.scrollY - 40) {
        b.destroy();
        return false;
      }
      return true;
    });
  }

  // Osuuko jokin osuma-alueen pisteistä esteeseen
  checkObstacles(time) {
    if (time < this.invulnerableUntil) return;
    const { x, y } = this.ship;
    const hit = HIT_POINTS.find((p) => this.isSolid(x + p.x, y + p.y));
    if (!hit) return;
    this.damage(time, hit.x >= 0 ? -1 : 1);
  }

  // Osuma: energia –1, alus työntyy poispäin esteestä ja vilkkuu suojan ajan
  damage(time, direction) {
    this.hp -= 1;
    this.ship.setHp(this.hp);
    play('hit', { volume: 0.6 });
    this.cameras.main.shake(180, 0.006);
    this.knock = direction * KNOCKBACK;
    if (this.hp <= 0) {
      this.destroyShip();
      return;
    }
    this.invulnerableUntil = time + INVULNERABLE_MS;
    this.tweens.killTweensOf(this.ship.parts);
    this.tweens.add({
      targets: this.ship.parts,
      alpha: 0.25,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(INVULNERABLE_MS / 200) - 1,
      onComplete: () => this.ship.setAlpha(1),
    });
  }

  // Räjähdys kipinöinä (ei verta, ei palasia): rengas ja säteittäin lentävät pisteet
  explode(x, y) {
    play('explosion', { volume: 0.8 });
    const ring = this.add.circle(x, y, 20).setStrokeStyle(4, 0xffb547).setDepth(7);
    this.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const d = 60 + Math.random() * 90;
      const p = this.add.rectangle(x, y, 6, 6, i % 3 ? 0xffb547 : 0xffffff).setDepth(7);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        alpha: 0,
        duration: 450 + Math.random() * 300,
        ease: 'Cubic.Out',
        onComplete: () => p.destroy(),
      });
    }
  }

  destroyShip() {
    this.finished = true;
    this.tweens.killTweensOf(this.ship.parts);
    this.ship.stopWeapon();
    this.ship.setVisible(false);
    this.explode(this.ship.x, this.ship.y);
    this.emitHud();
    this.time.delayedCall(1200, () => this.game.events.emit('sd-dead', { sector: this.sectorIndex, score: this.score }));
  }

  // Kartta loppui: alus kiitää ruudun yläreunan yli ja sektori on läpäisty
  clearSector() {
    this.finished = true;
    this.tweens.killTweensOf(this.ship.parts);
    this.ship.setAlpha(1);
    this.ship.stopWeapon();
    this.ship.setBoost(true);
    this.emitHud();
    this.tweens.add({
      targets: this.ship,
      y: this.cameras.main.scrollY - 120,
      duration: 900,
      delay: 300,
      ease: 'Cubic.In',
      onUpdate: () => this.ship.sync(),
      onComplete: () => {
        this.game.events.emit('sd-clear', { sector: this.sectorIndex, hp: this.hp, score: this.score });
      },
    });
  }

  // HUD päivitetään Reactissa vain, kun jokin näkyvä arvo muuttuu
  emitHud() {
    const total = this.mapH - GAME_H;
    const progress = Math.round((1 - this.cameras.main.scrollY / total) * 100);
    const hud = { hp: Math.max(0, this.hp), score: this.score, progress, sector: this.sectorIndex, name: this.sector.name };
    const key = `${hud.hp}|${hud.score}|${hud.progress}`;
    if (key === this.hudKey) return;
    this.hudKey = key;
    this.game.events.emit('sd-hud', hud);
  }
}