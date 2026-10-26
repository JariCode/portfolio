import * as Phaser from 'phaser';
import { SECTORS } from './sectors.js';
import { createStarfield } from './parallax.js';
import { createHitTest } from './obstacles.js';
import { PlayerShip, HITBOX, WEAPON_NAMES, createPlayerAnims, preloadPlayer } from './player.js';
import { Enemy, createFleetAnims, preloadFleet } from './enemies.js';
import { Boss } from './boss.js';
import { PICKUP_TYPES, Pickup, createPickupAnims, preloadPickups } from './pickups.js';
import { play, playMusic } from './sound.js';

// Pelin sisäinen koko (3:4). Kartta on 12 laattaa × 64 px = 768 px leveä, joten kartan
// leveys mahtuu kuvaan ja kamera liikkuu vain pystysuunnassa.
export const GAME_W = 768;
export const GAME_H = 1024;
export const MAX_HP = 5;
export const MAX_BOMBS = 3;
export const MAX_WEAPON = 3;

const T = 64;

// Kartta rullaa tällä nopeudella (px/s): 50 riviä × 64 px, josta ruudullinen näkyy heti,
// joten sektori kestää noin 40 s ennen pomoa
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

// Pelaajan ammukset aseen tason mukaan. tip = osumakohta suhteessa ammuksen keskipisteeseen
// (luodin ja säteen kärki edessä, plasmapallo keskeltä), r = osuma-alueen säde, damage = vahinko.
const SHOTS = {
  tykki: { key: 'pelaaja-ammus-tykki', anim: 'sd-ammus-tykki', speed: 950, tip: -12, r: 6, damage: 1 },
  salama: { key: 'pelaaja-ammus-salama', anim: 'sd-ammus-salama', speed: 1250, tip: -28, r: 5, damage: 1 },
  plasma: { key: 'pelaaja-ammus-iso', anim: 'sd-ammus-iso', speed: 700, tip: 0, r: 18, damage: 3 },
};
const INVULNERABLE_MS = 1600; // osuman jälkeen hetki suojassa, ettei sama osuma toistu heti
const KNOCKBACK = 340; // kiveen osuminen työntää alusta poispäin (px/s, vaimenee)
const SHIELD_MS = 8000;
const BOMB_DAMAGE = 20; // pommi tuhoaa pienet viholliset ja vie pomolta palan
const RAM_DAMAGE = 3; // törmäys viholliseen vahingoittaa myös vihollista

// Pisteet tehostimesta ja sektorin läpäisystä (jokaisesta jäljellä olevasta rungon palkista)
const PICKUP_POINTS = 50;
const HULL_BONUS = 200;

// Osuma-alueen reunapisteet: soikion kehältä 12 pistettä + keskipiste
const HIT_POINTS = [{ x: 0, y: 0 }].concat(
  Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: Math.cos(a) * HITBOX.rx, y: Math.sin(a) * HITBOX.ry };
  }),
);

// Uuden pelin lähtötiedot; myöhemmin sektorista toiseen siirtyvät nämä
export const NEW_RUN = { hp: MAX_HP, score: 0, bombs: 2, weapon: 1, kills: 0 };

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
    preloadFleet(this, s.fleet);
    preloadPickups(this);
  }

  create() {
    const s = this.sector;
    this.controls = this.registry.get('controls');
    this.hp = this.carry.hp;
    this.score = this.carry.score;
    this.bombs = this.carry.bombs;
    this.weapon = this.carry.weapon;
    this.kills = this.carry.kills;
    this.finished = false;
    this.invulnerableUntil = 0;
    this.shieldUntil = 0;
    this.knock = 0;
    this.elapsed = 0;
    this.bombRequests = this.controls.bomb;

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

    // ── Viholliset ja tehostimet sectors.js:n listoista ──
    createFleetAnims(this, s.fleet);
    createPickupAnims(this);
    // Vihollisen rivi kertoo, milloin se tulee: alimman rivin vihollinen heti alussa, ylimmän
    // juuri ennen pomoa, ja tasaisesti siltä väliltä. Kaikki saapuvat ruudun yläreunasta.
    // (Jos rivi ratkaisisi suoraan, ensimmäisen ruudullisen viholliset tulisivat kaikki kerralla.)
    const sectorTime = (this.mapH - GAME_H) / SCROLL_SPEED;
    this.waiting = s.enemies
      .map(([row, col, type, move]) => ({ col, type, move, at: ((this.mapH - (row * T + T / 2)) / this.mapH) * sectorTime }))
      .sort((a, b) => a.at - b.at);
    this.waitingPickups = s.pickups.map(([row, col, type]) => ({ row, col, type }));
    this.enemies = [];
    this.enemyBullets = [];
    this.pickups = [];
    this.boss = null;

    // ── Alus ──
    createPlayerAnims(this);
    this.ship = new PlayerShip(this, GAME_W / 2, cam.scrollY + GAME_H - 200);
    this.ship.setHp(this.hp);
    this.ship.sync();
    this.bullets = [];
    this.ship.onShot((barrel, x, y) => this.fire(barrel, x, y));

    // ── Näppäimet: nuolet ja WASD liikkuvat, välilyönti ampuu, B pommittaa ──
    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,B');
    this.keys.B.on('down', () => this.useBomb());

    // ── Sormella vetäminen: alus liikkuu sormen liikkeen verran, ei hyppää sormen alle ──
    // Vain ensimmäinen sormi ohjaa; toinen sormi voi samaan aikaan painaa ampumanappia.
    this.drag = null;
    this.input.on('pointerdown', (p) => {
      if (this.drag) return;
      this.drag = { id: p.id, px: p.x, py: p.y, sx: this.ship.x, sy: this.ship.y - cam.scrollY, tx: null, ty: null };
    });
    this.input.on('pointermove', (p) => {
      if (!this.drag || p.id !== this.drag.id || !p.isDown) return;
      this.drag.tx = this.drag.sx + (p.x - this.drag.px);
      this.drag.ty = this.drag.sy + (p.y - this.drag.py);
    });
    const release = (p) => {
      if (this.drag && p.id === this.drag.id) this.drag = null;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.hudKey = '';
    this.emitHud();
  }

  // ── Ampuminen ──
  // Aseen taso (player.js WEAPON_NAMES): 1 Tykki = luoti vuorotellen piipuista,
  // 2 Salama = säde molemmista piipuista joka laukauksella, 3 Plasma = säteet + plasmapallo
  // keulasta joka toisella laukauksella (3 vahinkoa, iso osuma-alue)
  fire(barrel, x, y) {
    if (this.finished) return;
    if (this.weapon === 1) {
      this.shot(SHOTS.tykki, x, y);
    } else {
      this.shot(SHOTS.salama, x, y);
      this.shot(SHOTS.salama, this.ship.x - (x - this.ship.x), y);
    }
    if (this.weapon >= 3 && barrel === 1) this.shot(SHOTS.plasma, this.ship.x, y - 20);
    play('shot', { volume: 0.25, gap: 0.1 });
  }

  shot(def, x, y) {
    const b = this.add.sprite(x, y, def.key).setScale(2).setDepth(3).play(def.anim);
    b.def = def;
    this.bullets.push(b);
  }

  // Pieni kipinä ammuksen osuessa
  spark(x, y, color = 0xffd28a) {
    const flash = this.add.circle(x, y, 10, color, 0.9).setDepth(5);
    this.tweens.add({ targets: flash, scale: 2.2, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
  }

  // Lyhyt teksti tapahtuman kohdalle (tehostin, pisteet)
  popup(x, y, text, color = '#ffb547') {
    const t = this.add
      .text(x, y, text, { fontFamily: '"Orbitron Variable", sans-serif', fontSize: '26px', fontStyle: '700', color, stroke: '#04030c', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(8);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.cameras.main;
    this.elapsed += dt;

    // ── Kartan rullaus: alus pysyy ruudulla samassa kohdassa, joten sitä siirretään samaa matkaa.
    // Pomon aikana kartta on pysähtynyt yläreunaan. ──
    const before = cam.scrollY;
    if (!this.finished && !this.boss) cam.scrollY = Math.max(0, cam.scrollY - SCROLL_SPEED * dt);
    const scrolled = before - cam.scrollY;
    this.updateStars(cam.scrollY, this.elapsed);

    this.updateBullets(dt, cam);
    this.updateEnemies(dt, scrolled, cam);
    this.updatePickups(dt);
    if (this.finished) return;

    this.moveShip(dt, cam, scrolled, time);
    this.ship.setFiring(this.keys.SPACE.isDown || this.controls.fire);
    // Kosketusnapin pommi: React kasvattaa laskuria, scene käyttää uudet painallukset
    if (this.controls.bomb !== this.bombRequests) {
      this.bombRequests = this.controls.bomb;
      this.useBomb();
    }
    this.spawn(cam);
    this.checkHits(time);
    this.updateShield(time);

    // Kartan loppu: pomo saapuu
    if (cam.scrollY <= 0 && !this.boss) {
      this.boss = new Boss(this, this.sector.fleet, this.sector.boss, cam);
      playMusic('boss');
    }

    this.emitHud();
  }

  // Viholliset tulevat aikataulun mukaan; tehostimet ovat kartalla paikallaan ja ilmestyvät,
  // kun niiden rivi tulee näkyviin ruudun yläreunassa
  spawn(cam) {
    const top = cam.scrollY - T;
    while (this.waiting.length && this.waiting[0].at <= this.elapsed) {
      const e = this.waiting.shift();
      this.enemies.push(new Enemy(this, this.sector.fleet, e.type, e.move, e.col * T + T / 2, cam.scrollY - 40));
    }
    this.waitingPickups = this.waitingPickups.filter((p) => {
      const y = p.row * T + T / 2;
      if (y < top) return true;
      this.pickups.push(new Pickup(this, p.type, p.col * T + T / 2, y));
      return false;
    });
  }

  // Osuuko alus kiveen, jos se olisi kohdassa (x, y)
  blocked(x, y) {
    return HIT_POINTS.some((p) => this.isSolid(x + p.x, y + p.y));
  }

  // Liike: kivet ovat kiinteitä, eli alus pysähtyy niihin eikä mene läpi edes suoja-aikana.
  // Vaaka- ja pystyliike tarkistetaan erikseen, jolloin alus liukuu kiven reunaa pitkin.
  moveShip(dt, cam, scrolled, time) {
    const ship = this.ship;
    let touching = false;

    // Rullaus: alus pysyy ruudulla paikallaan, paitsi jos kivi tulee ylhäältä vastaan.
    // Silloin kivi työntää alusta alaspäin.
    if (!this.blocked(ship.x, ship.y - scrolled)) ship.y -= scrolled;
    else touching = true;

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
    const nx = Phaser.Math.Clamp(ship.x + vx * dt, MARGIN_X, GAME_W - MARGIN_X);
    if (!this.blocked(nx, ship.y)) ship.x = nx;
    else if (nx !== ship.x) touching = true;
    const ny = Phaser.Math.Clamp(ship.y + vy * dt, minY, maxY);
    if (!this.blocked(ship.x, ny)) ship.y = ny;
    else if (ny !== ship.y) touching = true;

    // Kivi painoi aluksen ruudun alareunaan: alus puristuu ja liukuu lähimpään vapaaseen kohtaan
    if (ship.y > maxY) {
      ship.y = maxY;
      if (this.blocked(ship.x, ship.y)) {
        this.escape(ship);
        touching = true;
      }
    }
    ship.sync();

    // Kiveen osuminen vie runkoa (suoja-ajan välein) ja työntää alusta poispäin kivestä
    if (touching) {
      const left = this.blocked(ship.x - 8, ship.y);
      const right = this.blocked(ship.x + 8, ship.y);
      this.damage(time, left && !right ? 1 : right && !left ? -1 : 0);
    }
  }

  // Etsii lähimmän vaakasuunnassa vapaan kohdan (puristustilanne ruudun alareunassa)
  escape(ship) {
    for (let d = 8; d < GAME_W; d += 8) {
      for (const x of [ship.x - d, ship.x + d]) {
        if (x >= MARGIN_X && x <= GAME_W - MARGIN_X && !this.blocked(x, ship.y)) {
          ship.x = x;
          return;
        }
      }
    }
  }

  // Pelaajan ammukset: osuma viholliseen, pomoon tai kiveen
  updateBullets(dt, cam) {
    this.bullets = this.bullets.filter((b) => {
      const { speed, tip, r, damage } = b.def;
      b.y -= speed * dt;
      const tipY = b.y + tip;
      const boss = this.boss && !this.boss.dead && this.boss.contains(b.x, tipY, r) ? this.boss : null;
      const target = this.enemies.find((e) => !e.dead && e.contains(b.x, tipY, r)) ?? boss;
      if (target) {
        this.spark(b.x, tipY, 0xffffff);
        this.damageEnemy(target, damage);
      } else if (this.isSolid(b.x, tipY)) {
        this.spark(b.x, tipY);
      } else if (b.y > cam.scrollY - 60) {
        return true;
      }
      b.destroy();
      return false;
    });
  }

  damageEnemy(target, damage) {
    if (target === this.boss) {
      if (this.boss.hit(damage)) this.bossDefeated();
      return;
    }
    if (!target.hit(damage)) return;
    this.score += target.def.points;
    this.kills += 1;
    play('explosion', { volume: 0.5, gap: 0.05 });
    this.burst(target.x, target.y, 0.6);
  }

  updateEnemies(dt, scrolled, cam) {
    this.enemies = this.enemies.filter((e) => {
      const keep = e.update(dt, scrolled, cam, this.ship);
      if (!keep) e.destroy();
      else if (!this.finished) this.enemyBullets.push(...e.shoot(dt, cam, this.ship));
      return keep;
    });
    if (this.boss && !this.finished) this.enemyBullets.push(...this.boss.update(dt, cam, this.ship));
    this.enemyBullets = this.enemyBullets.filter((b) => {
      b.update(dt, scrolled);
      const sy = b.y - cam.scrollY;
      if (this.isSolid(b.x, b.y) || sy > GAME_H + 40 || sy < -60 || b.x < -40 || b.x > GAME_W + 40) {
        b.destroy();
        return false;
      }
      return true;
    });
  }

  updatePickups(dt) {
    this.pickups = this.pickups.filter((p) => {
      p.update(dt);
      if (this.finished || !p.near(this.ship.x, this.ship.y)) {
        // Ruudun alareunan alle jäänyt tehostin poistuu
        if (p.y - this.cameras.main.scrollY < GAME_H + 80) return true;
        p.destroy();
        return false;
      }
      this.collect(p);
      p.destroy();
      return false;
    });
  }

  collect(p) {
    play('pickup', { volume: 0.7 });
    this.score += PICKUP_POINTS;
    if (p.type === 'energia') this.hp = Math.min(MAX_HP, this.hp + 2);
    if (p.type === 'pommi') this.bombs = Math.min(MAX_BOMBS, this.bombs + 1);
    if (p.type === 'ase') this.weapon = Math.min(MAX_WEAPON, this.weapon + 1);
    if (p.type === 'kilpi') {
      this.shieldUntil = this.time.now + SHIELD_MS;
      this.ship.setShield(true);
    }
    this.ship.setHp(this.hp);
    const label = p.type === 'ase' ? `Ase: ${WEAPON_NAMES[this.weapon]}` : PICKUP_TYPES[p.type].label;
    this.popup(p.x, p.y - 30, label.toUpperCase());
  }

  // Kilpi välkkyy viimeiset kaksi sekuntia ennen kuin se loppuu
  updateShield(time) {
    if (!this.shieldUntil) return;
    const left = this.shieldUntil - time;
    if (left <= 0) {
      this.shieldUntil = 0;
      this.ship.setShield(false);
    } else if (left < 2000) {
      this.ship.shield.setAlpha(Math.floor(left / 150) % 2 ? 0.3 : 1);
    }
  }

  // Osumat alukseen: vihollisten ammukset ja törmäykset (kivet tarkistetaan liikkeessä)
  checkHits(time) {
    const { x, y } = this.ship;
    const inside = (cx, cy, r) => {
      const dx = (cx - x) / (HITBOX.rx + r);
      const dy = (cy - y) / (HITBOX.ry + r);
      return dx * dx + dy * dy <= 1;
    };

    // Ammus osuu: kilpi tai suoja-aika torjuu vahingon, mutta ammus katoaa silti
    this.enemyBullets = this.enemyBullets.filter((b) => {
      if (!inside(b.x, b.y, b.r)) return true;
      this.spark(b.x, b.y, 0xff6b3d);
      b.destroy();
      this.damage(time, 0);
      return false;
    });

    // Törmäys viholliseen tai pomoon
    const targets = this.enemies.filter((e) => !e.dead);
    if (this.boss && !this.boss.dead && !this.boss.entering) targets.push(this.boss);
    const rammed = targets.find((e) => HIT_POINTS.some((p) => e.contains(x + p.x, y + p.y)));
    if (rammed && time >= this.invulnerableUntil) {
      if (rammed !== this.boss) this.damageEnemy(rammed, RAM_DAMAGE);
      this.damage(time, rammed.x > x ? -1 : 1);
    }
  }

  // Osuma: runko –1, alus työntyy sivuun ja vilkkuu suojan ajan. Kilpi torjuu osuman.
  damage(time, direction) {
    if (time < this.invulnerableUntil || this.finished) return;
    this.knock = direction * KNOCKBACK;
    if (this.shieldUntil) {
      this.invulnerableUntil = time + 400;
      return;
    }
    this.hp -= 1;
    this.ship.setHp(this.hp);
    play('hit', { volume: 0.6 });
    this.cameras.main.shake(180, 0.006);
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

  // Pommi: valkoinen välähdys ja paineaalto, kaikki ruudulla olevat viholliset saavat
  // vahinkoa ja vihollisten ammukset katoavat
  useBomb() {
    if (this.finished || this.bombs <= 0) return;
    this.bombs -= 1;
    play('bomb', { volume: 0.9 });
    const cam = this.cameras.main;
    const flash = this.add.rectangle(0, 0, GAME_W, GAME_H, 0xffffff, 0.8).setOrigin(0).setScrollFactor(0).setDepth(9);
    this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
    const wave = this.add.circle(this.ship.x, this.ship.y, 40).setStrokeStyle(8, 0xffb547).setDepth(8);
    this.tweens.add({ targets: wave, scale: 18, alpha: 0, duration: 650, ease: 'Cubic.Out', onComplete: () => wave.destroy() });
    cam.shake(300, 0.012);
    this.enemyBullets.forEach((b) => b.destroy());
    this.enemyBullets = [];
    for (const e of this.enemies) {
      const sy = e.y - cam.scrollY;
      if (!e.dead && sy > -40 && sy < GAME_H + 20) this.damageEnemy(e, BOMB_DAMAGE);
    }
    if (this.boss && !this.boss.dead) this.damageEnemy(this.boss, BOMB_DAMAGE);
    this.invulnerableUntil = Math.max(this.invulnerableUntil, this.time.now + 800);
    this.emitHud();
  }

  // Räjähdys kipinöinä (ei verta, ei palasia): rengas ja säteittäin lentävät pisteet
  burst(x, y, size = 1) {
    const ring = this.add.circle(x, y, 20 * size).setStrokeStyle(4, 0xffb547).setDepth(7);
    this.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
    const count = Math.round(18 * size);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const d = (60 + Math.random() * 90) * size;
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
    play('explosion', { volume: 0.8 });
    this.burst(this.ship.x, this.ship.y);
    this.emitHud();
    this.time.delayedCall(1200, () => this.game.events.emit('sd-dead', this.stats()));
  }

  // Pomo kaatui: räjähdysten sarja, pisteet ja sektori läpi
  bossDefeated() {
    const b = this.boss;
    this.score += b.def.points;
    this.kills += 1;
    this.finished = true;
    this.enemyBullets.forEach((e) => e.destroy());
    this.enemyBullets = [];
    this.ship.stopWeapon();
    this.cameras.main.shake(900, 0.01);
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 180, () => {
        play('explosion', { volume: 0.8, gap: 0.05 });
        this.burst(b.x + (Math.random() - 0.5) * 160, b.y + (Math.random() - 0.5) * 180, 1.2);
      });
    }
    this.popup(b.x, b.y, `+${b.def.points}`, '#29e0ff');
    this.emitHud();
    this.time.delayedCall(1600, () => {
      b.destroy();
      this.clearSector();
    });
  }

  // Sektori läpi: bonus jäljellä olevasta rungosta ja alus kiitää ruudun yläreunan yli
  clearSector() {
    this.score += this.hp * HULL_BONUS;
    this.tweens.killTweensOf(this.ship.parts);
    this.ship.setAlpha(1);
    this.ship.setBoost(true);
    this.emitHud();
    this.tweens.add({
      targets: this.ship,
      y: this.cameras.main.scrollY - 120,
      duration: 900,
      delay: 300,
      ease: 'Cubic.In',
      onUpdate: () => this.ship.sync(),
      onComplete: () => this.game.events.emit('sd-clear', this.stats()),
    });
  }

  stats() {
    return { sector: this.sectorIndex, hp: Math.max(0, this.hp), score: this.score, kills: this.kills, bombs: this.bombs, weapon: this.weapon };
  }

  // HUD päivitetään Reactissa vain, kun jokin näkyvä arvo muuttuu
  emitHud() {
    const total = this.mapH - GAME_H;
    const progress = Math.round((1 - this.cameras.main.scrollY / total) * 100);
    const boss = this.boss ? { name: this.boss.name, hp: this.boss.hp, max: this.boss.maxHp } : null;
    const hud = { hp: Math.max(0, this.hp), score: this.score, progress, bombs: this.bombs, weapon: this.weapon, sector: this.sectorIndex, name: this.sector.name, boss };
    const key = `${hud.hp}|${hud.score}|${hud.progress}|${hud.bombs}|${hud.weapon}|${boss?.hp}`;
    if (key === this.hudKey) return;
    this.hudKey = key;
    this.game.events.emit('sd-hud', hud);
  }
}