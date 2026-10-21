import * as Phaser from 'phaser';
import mapData from './maps/maailma1.json';
import { PLAYER_SHEET, PLAYER_ANIMS, JUMP_FRAME } from './player.js';
import { createSkyline } from './skyline.js';

// Pelin sisäinen koko (16:9). Kartta on 12 laattaa x 64 px = 768 px korkea, joten
// koko kartan korkeus mahtuu kuvaan eikä kamera liiku pystysuunnassa.
export const GAME_W = 1366;
export const GAME_H = 768;

const TILESET_FILE = '/games/zrunner/kaupunki.png';

// Laattojen numerot Tiledin JSONissa (firstgid 1 → kuvan laatta + 1).
// Katot ja metallitasot: niihin törmätään vain ylhäältä, alta voi hypätä läpi.
const ONE_WAY = [9, 10, 11, 17, 18, 19];
// Lätäkkö on koriste, vaikka se olisi piirretty Maastoon
const NO_COLLIDE = [32];

// Hahmo pienennetään laattoihin sopivaksi: noin 1,2 laattaa korkea.
// Arcade-fysiikka skaalaa törmäyslaatikon samalla kertoimella.
const PLAYER_SCALE = 0.72;

// Liikkeen tuntuma. Hyppy nousee noin 3,5 laattaa: riittää tasoille (3 laattaa kadusta),
// katoille tarvitaan askelma (laatikko, jäteastia).
const RUN_SPEED = 300;
const ACCEL_GROUND = 2600;
const ACCEL_AIR = 1500;
const GRAVITY = 2000;
const JUMP_VELOCITY = -950;
// Putoamisnopeuden yläraja: 1100 px/s on 18 px fysiikka-askelta kohti, mikä pysyy
// Game.jsx:n tileBiasin (40) alla. Muuten korkealta pudotessa hahmo voi mennä laatan läpi.
const MAX_FALL = 1100;
const COYOTE_MS = 100; // hypyn saa vielä hetken reunalta pudottuaan
const BUFFER_MS = 120; // liian aikaisin painettu hyppy muistetaan hetken

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('level');
  }

  preload() {
    this.load.tilemapTiledJSON('maailma1', mapData);
    this.load.image('kaupunki', TILESET_FILE);
    this.load.spritesheet('pelaaja', PLAYER_SHEET.file, {
      frameWidth: PLAYER_SHEET.frameWidth,
      frameHeight: PLAYER_SHEET.frameHeight,
    });
  }

  create() {
    this.controls = this.registry.get('controls');
    this.updateSkyline = createSkyline(this);

    // ── Kartta: Tausta ja Maasto pelaajan takana, Edusta edessä ──
    const map = this.make.tilemap({ key: 'maailma1' });
    const tiles = map.addTilesetImage('kaupunki', 'kaupunki');
    const back = map.createLayer('Tausta', tiles).setDepth(1);
    const ground = map.createLayer('Maasto', tiles).setDepth(2);
    map.createLayer('Edusta', tiles).setDepth(4);
    this.ground = ground;

    // Kaikki Maaston laatat ovat kiinteitä paitsi koristeet
    ground.setCollisionByExclusion([-1, ...NO_COLLIDE]);
    // Katot ja tasot vain ylhäältä, myös jos ne on piirretty Taustaan
    back.setCollision(ONE_WAY);
    for (const layer of [ground, back]) {
      layer.forEachTile((tile) => {
        if (ONE_WAY.includes(tile.index)) tile.setCollision(false, false, true, false);
      });
    }

    this.mapWidth = map.widthInPixels;
    this.mapHeight = map.heightInPixels;
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight + 400);
    this.physics.world.setBoundsCollision(true, true, false, false); // alareuna auki: kuoppaan voi pudota

    // Aloituspiste ja maali Objektit-tasolta (nimet "pelaaja" ja "maali"),
    // muuten oletukset: alku vasemmasta reunasta, maali kartan lopusta
    const objects = map.getObjectLayer('Objektit')?.objects ?? [];
    const spawn = objects.find((o) => o.name === 'pelaaja') ?? { x: 2 * 64, y: 10 * 64 };
    const goal = objects.find((o) => o.name === 'maali');
    this.goalX = goal ? goal.x : this.mapWidth - 4 * 64;
    this.spawn = { x: spawn.x, y: spawn.y };

    // ── Pelaaja ──
    this.createAnims();
    const p = this.physics.add.sprite(spawn.x, spawn.y, 'pelaaja', 0);
    p.setOrigin(PLAYER_SHEET.originX, PLAYER_SHEET.originY).setDepth(3).setScale(PLAYER_SCALE);
    p.body.setSize(PLAYER_SHEET.body.width, PLAYER_SHEET.body.height);
    p.body.setOffset(PLAYER_SHEET.body.offsetX, PLAYER_SHEET.body.offsetY);
    p.body.setGravityY(GRAVITY);
    p.body.setMaxVelocityY(MAX_FALL);
    p.setCollideWorldBounds(true);
    p.play('idle');
    this.player = p;
    this.physics.add.collider(p, ground);
    this.physics.add.collider(p, back);

    // ── Kamera seuraa pelaajaa, katsoo hieman eteenpäin ──
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.mapWidth, this.mapHeight);
    cam.startFollow(p, true, 0.12, 0.12);
    cam.setFollowOffset(-120, 0);
    cam.setDeadzone(80, 200);
    cam.setRoundPixels(true);

    // ── Näppäimet: kuunnellaan window-tasolla (Phaserin oletus), Esc jää modaalille ──
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard.addKeys({
      left: K.LEFT, a: K.A, right: K.RIGHT, d: K.D,
      up: K.UP, w: K.W, space: K.SPACE, x: K.X, k: K.K,
    });

    this.lastGround = 0;
    this.jumpPressedAt = -Infinity;
    this.prevJump = false;
    this.prevAttack = false;
    this.attacking = false;
    this.safe = { x: spawn.x, y: spawn.y };
    this.falls = 0;
    this.elapsed = 0; // pelattu aika ruutujen kestoista, ei kellonajasta
    this.finished = false;
    this.lastHud = 0;

    p.on('animationcomplete-attack', () => {
      this.attacking = false;
    });

    // Pelinäkymä fokusoituu modaalissa; jos ikkuna menettää fokuksen, painetut näppäimet nollataan
    this.game.events.on(Phaser.Core.Events.BLUR, this.releaseKeys, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.releaseKeys, this);
    });
  }

  createAnims() {
    if (this.anims.exists('idle')) return; // animaatiot ovat pelin yhteisiä, luodaan kerran
    for (const a of PLAYER_ANIMS) {
      const start = a.row * PLAYER_SHEET.columns;
      this.anims.create({
        key: a.key,
        frames: this.anims.generateFrameNumbers('pelaaja', { start, end: start + a.frames - 1 }),
        frameRate: a.frameRate,
        repeat: a.repeat,
      });
    }
  }

  releaseKeys() {
    this.input.keyboard.resetKeys();
    Object.keys(this.controls).forEach((k) => {
      this.controls[k] = false;
    });
  }

  update(time, delta) {
    this.updateSkyline(this.cameras.main);
    if (this.finished) return;
    this.elapsed += delta;

    const p = this.player;
    const body = p.body;
    const k = this.keys;
    const c = this.controls;
    const left = k.left.isDown || k.a.isDown || c.left;
    const right = k.right.isDown || k.d.isDown || c.right;
    const jump = k.up.isDown || k.w.isDown || k.space.isDown || c.jump;
    const attack = k.x.isDown || k.k.isDown || c.attack;
    const onGround = body.blocked.down;

    if (onGround) {
      this.lastGround = time;
      // Turvallinen kohta putoamisen jälkeen: viimeisin paikka, jossa seistiin
      this.safe.x = p.x;
      this.safe.y = p.y;
    }

    // Hyppy: painallus muistetaan hetken ja reunalta saa hypätä vielä hetken pudottuaan
    if (jump && !this.prevJump) this.jumpPressedAt = time;
    if (time - this.jumpPressedAt < BUFFER_MS && time - this.lastGround < COYOTE_MS) {
      body.setVelocityY(JUMP_VELOCITY);
      this.jumpPressedAt = -Infinity;
      this.lastGround = -Infinity;
    }
    // Lyhyt painallus = matala hyppy
    if (!jump && body.velocity.y < JUMP_VELOCITY * 0.45) {
      body.setVelocityY(JUMP_VELOCITY * 0.45);
    }
    this.prevJump = jump;

    // Lyönti: vain animaatio toistaiseksi, osumat tulevat zombien mukana
    if (attack && !this.prevAttack && !this.attacking && onGround) {
      this.attacking = true;
      p.play('attack');
    }
    this.prevAttack = attack;

    // Seinää päin ei kiihdytetä: muuten törmäys työntää hahmoa takaisin joka ruudulla
    // ja animaatio vaihtelee juoksun ja seisonnan välillä, jolloin hahmo tärisee
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const blocked = dir !== 0 && this.wallAhead(dir);
    const moving = dir !== 0 && !blocked && !this.attacking;

    // Vauhti kiihtyy ja hidastuu pehmeästi
    const target = moving ? dir * RUN_SPEED : 0;
    const accel = (onGround ? ACCEL_GROUND : ACCEL_AIR) * (delta / 1000);
    const vx = blocked ? 0 : body.velocity.x;
    body.setVelocityX(vx < target ? Math.min(vx + accel, target) : Math.max(vx - accel, target));
    if (dir !== 0) p.setFlipX(dir < 0);

    // Animaatio painetun suunnan mukaan, ei nopeuden: törmäyksen pienet heilahdukset eivät vaihda sitä
    if (!this.attacking) {
      if (!onGround) {
        p.anims.stop();
        p.setFrame(JUMP_FRAME);
      } else if (moving) {
        p.play('run', true);
      } else {
        p.play('idle', true);
      }
    }

    // Kuoppaan pudonnut palaa viimeisimmälle turvalliselle paikalle
    if (p.y > this.mapHeight + 150) this.respawn();

    // Maali
    if (p.x >= this.goalX) {
      this.finish();
      return;
    }

    // Aika näytölle kymmenen kertaa sekunnissa (React-HUD)
    if (time - this.lastHud > 100) {
      this.lastHud = time;
      this.game.events.emit('zr-hud', { time: this.elapsed, falls: this.falls });
    }
  }

  // Onko kulkusuunnassa heti vartalon vieressä seinä? Katsotaan laatat suoraan eikä
  // body.blocked-tietoa, joka vaihtelee ruudusta toiseen, kun hahmo nojaa seinään.
  wallAhead(dir) {
    const b = this.player.body;
    const x = dir > 0 ? b.right + 1 : b.left - 1;
    return [b.top + 4, b.center.y, b.bottom - 4].some((y) => {
      const tile = this.ground.getTileAtWorldXY(x, y);
      return tile && (dir > 0 ? tile.collideLeft : tile.collideRight);
    });
  }

  respawn() {
    const p = this.player;
    this.falls += 1;
    // Siirretään hieman taaksepäin reunalta, jos siellä on maata
    const back = p.flipX ? 48 : -48;
    const tileBelow = this.ground.getTileAtWorldXY(this.safe.x + back, this.safe.y + 8);
    const x = tileBelow?.collides ? this.safe.x + back : this.safe.x;
    p.body.reset(x, this.safe.y);
    p.setVelocity(0, 0);
    this.cameras.main.flash(250, 255, 61, 200);
    // Hetken vilkkuminen kertoo, että pelaaja palasi
    this.tweens.add({ targets: p, alpha: 0.3, duration: 90, yoyo: true, repeat: 5 });
  }

  finish() {
    this.finished = true;
    const p = this.player;
    p.body.setVelocity(0, 0);
    p.body.setAllowGravity(false);
    p.play('idle', true);
    this.game.events.emit('zr-finish', { time: this.elapsed, falls: this.falls });
  }
}