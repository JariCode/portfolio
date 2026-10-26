import * as Phaser from 'phaser';
import { SPRITE_BASE, SPRITES, sprite } from './sprites.js';

// Viholliset ja niiden ammukset. Kaikki sijainnit ovat maailman koordinaateissa (kartta).
// Ruudulla liikkuvat oliot siirretään joka ruudulla kameran rullauksen verran (scrolled),
// jolloin "nopeus alaspäin" tarkoittaa nopeutta ruudun suhteen.

const ENEMY_SCALE = 2;

// Vihollistyypit. hp = osumia ammuksista, points = pisteet tuhoamisesta, rx/ry = osuma-alueen
// soikio (pelin pikseleinä, mitattu kuvan näkyvästä osasta), speed = nopeus alas (px/s).
// fire: ammus (BULLETS), väli (ms) ja kuvio (ks. Enemy.shoot). null = ei ammu.
export const ENEMY_TYPES = {
  scout: { hp: 2, points: 100, rx: 22, ry: 22, speed: 200, fire: null },
  fighter: { hp: 3, points: 150, rx: 24, ry: 22, speed: 150, fire: { bullet: 'luoti', every: 1700, pattern: 'suora' } },
  bomber: { hp: 6, points: 250, rx: 30, ry: 27, speed: 110, fire: { bullet: 'iso', every: 2100, pattern: 'viuhka' } },
  torpedo: { hp: 6, points: 300, rx: 54, ry: 20, speed: 80, fire: { bullet: 'torpedo', every: 2600, pattern: 'tahtaa' } },
  frigate: { hp: 12, points: 500, rx: 34, ry: 38, speed: 70, fire: { bullet: 'luoti', every: 1500, pattern: 'sarja' } },
  support: { hp: 6, points: 300, rx: 28, ry: 28, speed: 90, fire: { bullet: 'aalto', every: 2800, pattern: 'suora' } },
};

// Vihollisten ammukset: sprite-arkin pääte, osuma-säde, nopeus ja koko
export const BULLETS = {
  luoti: { sheet: 'ammus-luoti', r: 7, speed: 330, scale: 2 },
  iso: { sheet: 'ammus-iso-luoti', r: 7, speed: 300, scale: 2 },
  torpedo: { sheet: 'ammus-torpedo', r: 9, speed: 260, scale: 2 },
  aalto: { sheet: 'ammus-aalto', r: 26, speed: 220, scale: 1.5 },
};

// Liikkeet
const WAVE_AMPLITUDE = 110; // aalto: sivuttaisliikkeen laajuus (px)
const DIVE_STOP = 230; // sukellus: pysähtyy tälle korkeudelle ruudulla ennen syöksyä
const DIVE_WAIT = 0.6; // s
const DIVE_SPEED = 540;

// Ladataan sektorin laivaston kaikki kuvat (runko, moottori, tuho, aseet, ammukset)
export function preloadFleet(scene, fleet) {
  for (const s of SPRITES.filter((x) => x.key.startsWith(`${fleet}-`))) {
    if (!scene.textures.exists(s.key)) scene.load.spritesheet(s.key, SPRITE_BASE + s.file, { frameWidth: s.w, frameHeight: s.h });
  }
}

export function createFleetAnims(scene, fleet) {
  for (const s of SPRITES.filter((x) => x.key.startsWith(`${fleet}-`) && x.frames > 1)) {
    if (scene.anims.exists(s.key)) continue;
    const once = s.key.endsWith('-tuho') || s.key.endsWith('-aseet');
    scene.anims.create({
      key: s.key,
      frames: scene.anims.generateFrameNumbers(s.key),
      frameRate: once ? 18 : 12,
      repeat: once ? 0 : -1,
    });
  }
}

const has = (key) => SPRITES.some((s) => s.key === key);

// Vihollisen ammus. vx/vy ovat nopeus ruudun suhteen (px/s).
export class EnemyBullet {
  constructor(scene, fleet, kind, x, y, angle) {
    const b = BULLETS[kind];
    const key = `${fleet}-${b.sheet}`;
    this.r = b.r;
    this.x = x;
    this.y = y;
    // Kulma 0 = suoraan alas
    this.vx = Math.sin(angle) * b.speed;
    this.vy = Math.cos(angle) * b.speed;
    this.sprite = scene.add.sprite(x, y, key).setScale(b.scale).setDepth(5);
    // Kuvat on piirretty kärki ylöspäin: käännetään kulkusuuntaan
    this.sprite.setRotation(Math.PI - angle);
    if (sprite(key).frames > 1) this.sprite.play(key);
  }

  update(dt, scrolled) {
    this.x += this.vx * dt;
    this.y += this.vy * dt - scrolled;
    this.sprite.setPosition(this.x, this.y);
  }

  destroy() {
    this.sprite.destroy();
  }
}

export class Enemy {
  // x, y = syntypaikka maailmassa, type = ENEMY_TYPES-avain, move = suora | aalto | sukellus | paikallaan
  constructor(scene, fleet, type, move, x, y) {
    this.scene = scene;
    this.fleet = fleet;
    this.type = type;
    this.def = ENEMY_TYPES[type];
    this.move = move;
    this.hp = this.def.hp;
    this.x = x;
    this.y = y;
    this.x0 = x;
    this.t = 0;
    this.dead = false;
    this.diving = null;
    // Ensimmäinen laukaus pienen satunnaisen viiveen jälkeen, etteivät kaikki ammu yhtä aikaa
    this.nextShot = this.def.fire ? 0.5 + Math.random() * 0.9 : Infinity;

    const base = `${fleet}-${type}`;
    const add = (key) => scene.add.sprite(x, y, key).setScale(ENEMY_SCALE).setRotation(Math.PI).setDepth(3);
    this.engine = add(`${base}-moottori`).play(`${base}-moottori`);
    this.weapons = has(`${base}-aseet`) ? add(`${base}-aseet`) : null;
    this.body = add(base);
    this.parts = [this.engine, this.weapons, this.body].filter(Boolean);
  }

  // Liike ruudun suhteen; palauttaa false, kun vihollinen on poistunut ruudulta
  update(dt, scrolled, cam, ship) {
    // Tuhoanimaatio jää kartalle paikalleen (rullaa kartan mukana), kunnes se on soitettu loppuun
    if (this.dead) return this.body.active;
    this.t += dt;
    const d = this.def;
    switch (this.move) {
      case 'aalto':
        this.y += d.speed * dt - scrolled;
        this.x = Phaser.Math.Clamp(this.x0 + Math.sin(this.t * 2.2) * WAVE_AMPLITUDE, 40, 728);
        break;
      case 'sukellus': {
        const screenY = this.y - cam.scrollY;
        if (!this.diving && screenY < DIVE_STOP) {
          this.y += 170 * dt - scrolled;
        } else if (!this.diving) {
          this.y -= scrolled;
          this.wait = (this.wait ?? 0) + dt;
          // Syöksy kohti aluksen sen hetkistä paikkaa
          if (this.wait > DIVE_WAIT) {
            const a = Math.atan2(ship.x - this.x, ship.y - this.y);
            this.diving = { vx: Math.sin(a) * DIVE_SPEED, vy: Math.max(200, Math.cos(a) * DIVE_SPEED) };
          }
        } else {
          this.x += this.diving.vx * dt;
          this.y += this.diving.vy * dt - scrolled;
        }
        break;
      }
      case 'paikallaan':
        // Pysyy kartalla paikallaan, joten liikkuu ruudulla kartan mukana
        break;
      default:
        this.y += d.speed * dt - scrolled;
    }
    this.parts.forEach((p) => p.setPosition(this.x, this.y));
    const screenY = this.y - cam.scrollY;
    return screenY < cam.height + 140 && this.x > -120 && this.x < 888;
  }

  // Ampuu, kun on kunnolla ruudulla. Palauttaa uudet ammukset.
  shoot(dt, cam, ship) {
    const f = this.def.fire;
    const screenY = this.y - cam.scrollY;
    if (!f || this.dead || screenY < 40 || screenY > cam.height * 0.7) return [];
    this.nextShot -= dt;
    if (this.nextShot > 0) return [];
    this.nextShot = f.every / 1000;
    if (this.weapons) this.weapons.play(`${this.fleet}-${this.type}-aseet`);
    const aim = Math.atan2(ship.x - this.x, ship.y - this.y);
    const at = (angle, dx = 0) => new EnemyBullet(this.scene, this.fleet, f.bullet, this.x + dx, this.y + this.def.ry, angle);
    switch (f.pattern) {
      case 'viuhka':
        return [-0.35, 0, 0.35].map((a) => at(a));
      case 'tahtaa':
        return [at(Phaser.Math.Clamp(aim, -0.7, 0.7))];
      case 'sarja':
        return [-0.12, 0, 0.12].map((a) => at(Phaser.Math.Clamp(aim, -0.6, 0.6) + a));
      default:
        return [at(0)];
    }
  }

  // Onko piste osuma-alueen sisällä (r = ammuksen säde)
  contains(px, py, r = 0) {
    const dx = (px - this.x) / (this.def.rx + r);
    const dy = (py - this.y) / (this.def.ry + r);
    return dx * dx + dy * dy <= 1;
  }

  // Osuma: välähtää valkoisena. Palauttaa true, jos vihollinen tuhoutui.
  hit(damage = 1) {
    if (this.dead) return false;
    this.hp -= damage;
    this.body.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(60, () => this.body.active && this.body.clearTint());
    if (this.hp > 0) return false;
    this.die();
    return true;
  }

  // Tuhoutuminen: paketin oma tuhoanimaatio (kipinöivät palaset), sitten pois
  die() {
    this.dead = true;
    this.engine.destroy();
    this.weapons?.destroy();
    this.parts = [this.body];
    this.body.clearTint();
    const key = `${this.fleet}-${this.type}-tuho`;
    this.body.play(key);
    this.body.once('animationcomplete', () => this.body.destroy());
    // Varmistus: jos tuhoanimaatiota ei voi soittaa (esim. kuva puuttuu palvelimelta), kuori ei jää ruudulle
    this.scene.time.delayedCall(1500, () => this.body.active && this.body.destroy());
  }

  destroy() {
    this.parts.forEach((p) => p.destroy());
  }
}