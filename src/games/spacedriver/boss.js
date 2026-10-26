import * as Phaser from 'phaser';
import { EnemyBullet } from './enemies.js';

// Sektorin pomo: iso alus, joka saapuu, kun kartta loppuu. Kamera on silloin pysähtynyt,
// joten pomo liikkuu ruudun koordinaateissa (kartan yläreunassa).
// Hyökkäykset vuorottelevat. Kun energiaa on alle puolet, pomo raivostuu ja ampuu tiheämmin.

const BOSS_SCALE = 2;
const ENTER_Y = 320; // pomon keskikohta ruudulla taistelun aikana (HUDin alapuolella)
// Kiviin pidetään väli: kuvan siivet ulottuvat hieman osuma-alueen yli
const ROCK_MARGIN = 10;
const ENTER_MS = 2600;
const SWAY = 210; // sivuttaisliikkeen enimmäislaajuus (px); kivet voivat kaventaa sitä
// Hyökkäysten väli oletuksena (sektorin 1 pomo); sectors.js voi antaa omat
const ATTACK_MS = 1700;
const RAGE_ATTACK_MS = 1050;

export class Boss {
  // def: { type, name, hp, points, rx?, ry?, attack?, rage?, speed? }, sectors.js.
  // rx/ry: osuma-alueen soikio, jos pomon kuva on eri kokoinen kuin risteilijän (oletus 68 × 84).
  // attack/rage: hyökkäysten väli (ms) normaalisti ja raivossa, speed: heilunnan nopeus
  // (kerroin). Myöhempien sektorien pomot ovat näillä nopeampia, koska pelaajalla on niitä
  // vastaan parempi ase.
  constructor(scene, fleet, def, cam) {
    this.scene = scene;
    this.fleet = fleet;
    this.def = def;
    this.name = def.name;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.rx = def.rx ?? 68;
    this.ry = def.ry ?? 84;
    this.attackMs = def.attack ?? ATTACK_MS;
    this.rageMs = def.rage ?? RAGE_ATTACK_MS;
    this.speed = def.speed ?? 1;
    // Pomo pysyy kivien välissä: haetaan taistelukorkeudelta vapaa leveys ja heilutaan sen sisällä
    const span = this.freeSpan(cam.scrollY + ENTER_Y);
    this.center = (span.min + span.max) / 2;
    this.sway = Math.min(SWAY, (span.max - span.min) / 2);
    this.x = this.center;
    this.y = cam.scrollY - 200;
    this.t = 0;
    // Heilunnan vaihe kasvaa vasta saapumisen jälkeen ja nopeuden mukaan: pomo lähtee
    // heilumaan keskeltä eikä hyppää, kun saapuminen päättyy tai raivo muuttaa nopeutta
    this.phase = 0;
    this.entering = true;
    this.dead = false;
    this.attack = 0;
    this.nextAttack = this.attackMs / 1000;

    const base = `${fleet}-${def.type}`;
    this.key = base;
    const add = (key) => scene.add.sprite(this.x, this.y, key).setScale(BOSS_SCALE).setRotation(Math.PI).setDepth(3);
    this.engine = add(`${base}-moottori`).play(`${base}-moottori`);
    this.weapons = add(`${base}-aseet`);
    this.body = add(base);
    this.parts = [this.engine, this.weapons, this.body];

    // Saapuminen ruudun yläpuolelta; sen aikana pomoon ei voi osua
    scene.tweens.add({
      targets: this,
      y: cam.scrollY + ENTER_Y,
      duration: ENTER_MS,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.entering = false;
      },
    });
  }

  // Osuuko pomo kiveen kohdassa (x, y): soikion kehä ja keskipiste
  blocked(x, y) {
    if (this.scene.isSolid(x, y)) return true;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (this.scene.isSolid(x + Math.cos(a) * (this.rx + ROCK_MARGIN), y + Math.sin(a) * (this.ry + ROCK_MARGIN))) return true;
    }
    return false;
  }

  // Leveimmän kiviltä vapaan välin rajat (pomon keskipisteen x) annetulla korkeudella.
  // Jos tilaa ei ole lainkaan, pomo pysyy keskellä.
  freeSpan(y) {
    let best = { min: 384, max: 384 };
    let start = null;
    for (let x = this.rx; x <= 768 - this.rx + 8; x += 8) {
      const free = x <= 768 - this.rx && !this.blocked(x, y);
      if (free && start === null) start = x;
      if (!free && start !== null) {
        if (x - 8 - start > best.max - best.min) best = { min: start, max: x - 8 };
        start = null;
      }
    }
    return best;
  }

  get rage() {
    return this.hp < this.maxHp / 2;
  }

  // Liike ja hyökkäykset. Palauttaa uudet ammukset.
  update(dt, cam, ship) {
    if (this.dead) return [];
    this.t += dt;
    if (!this.entering) {
      this.phase += dt * (this.rage ? 0.9 : 0.6) * this.speed;
      this.x = this.center + Math.sin(this.phase) * this.sway;
    }
    this.parts.forEach((p) => p.setPosition(this.x, this.y));
    if (this.entering) return [];

    this.nextAttack -= dt;
    if (this.nextAttack > 0) return [];
    this.nextAttack = (this.rage ? this.rageMs : this.attackMs) / 1000;
    this.weapons.play(`${this.key}-aseet`);
    const kind = this.attack++ % 3;
    const aim = Math.atan2(ship.x - this.x, ship.y - this.y);
    const shot = (bullet, angle, dx = 0) => new EnemyBullet(this.scene, this.fleet, bullet, this.x + dx, this.y + this.ry - 20, angle);

    // 1: tähdätty viuhka, 2: torpedot kyljistä, 3: luotirengas
    if (kind === 0) {
      const spread = this.rage ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.24, 0, 0.24];
      return spread.map((a) => shot('luoti', Phaser.Math.Clamp(aim, -0.8, 0.8) + a));
    }
    if (kind === 1) {
      return [-56, 56].map((dx) => shot('torpedo', Phaser.Math.Clamp(Math.atan2(ship.x - this.x - dx, ship.y - this.y), -0.6, 0.6), dx));
    }
    const count = this.rage ? 16 : 12;
    return Array.from({ length: count }, (_, i) => shot('iso', (i / count) * Math.PI * 2 + this.t));
  }

  contains(px, py, r = 0) {
    const dx = (px - this.x) / (this.rx + r);
    const dy = (py - this.y) / (this.ry + r);
    return dx * dx + dy * dy <= 1;
  }

  // Palauttaa true, kun pomo tuhoutui tästä osumasta
  hit(damage = 1) {
    if (this.dead || this.entering) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.body.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(50, () => this.body.active && this.body.clearTint());
    if (this.hp > 0) return false;
    this.dead = true;
    this.engine.destroy();
    this.weapons.destroy();
    this.body.clearTint();
    this.body.play(`${this.key}-tuho`);
    return true;
  }

  destroy() {
    this.parts.forEach((p) => p.active && p.destroy());
  }
}