import * as Phaser from 'phaser';
import { PLAYER_SHEET, PLAYER_ANIMS, JUMP_FRAME } from './player.js';
import { createSkyline } from './skyline.js';
import { Walker, ZOMBIE_BODY, createZombieAnims, preloadZombies } from './enemies.js';
import { createOrbs, collectOrb } from './orbs.js';
import { createEnergyPacks, collectPack } from './energy.js';
import Train from './train.js';
import Car from './car.js';
import { WORLDS } from './worlds.js';
import { play } from './sound.js';

// Pelin sisäinen koko (16:9). Kartta on 12 laattaa x 64 px = 768 px korkea, joten
// koko kartan korkeus mahtuu kuvaan eikä kamera liiku pystysuunnassa.
export const GAME_W = 1366;
export const GAME_H = 768;
export const MAX_HP = 5;

const T = 64;

// Laattojen numerot Tiledin JSONissa (firstgid 1 → kuvan laatta + 1). Kaikki tilesetit
// noudattavat samaa järjestystä, joten säännöt pätevät jokaisessa maailmassa.
// Katot, katokset ja tasot: niihin törmätään vain ylhäältä, alta voi hypätä läpi.
const ONE_WAY = [9, 10, 11, 17, 18, 19];
// Maa (rivi 1) ja esteet (rivi 3, kuvat 5–8) ovat kiinteitä myös Tausta-tasolla,
// jos ne on piirretty sinne vahingossa
const SOLID = [1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23, 24];
const GROUND = [1, 2, 3, 4, 5, 6, 7, 8];
// Lätäkkö on koriste, vaikka se olisi piirretty Maastoon
const NO_COLLIDE = [32];

const ZOMBIE_TYPES = ['zombi1', 'zombi2', 'zombi3', 'zombi4'];

// Laatan kuvan yläreunaan jäävä tyhjä tila, jota pienemmällä ei ole väliä (pikseleinä)
const MIN_INSET = 3;

// Kuinka monta pikseliä kunkin laatan kuvan yläreunassa on tyhjää. Mitataan tilesetin
// kuvasta, joten uusi tai muutettu tileset ei vaadi muutoksia koodiin. Taulukon indeksi
// on kuvan laatta (Tiledin numero - 1); tyhjä laatta saa arvon T.
function tileInsets(scene, key) {
  const img = scene.textures.get(key).getSourceImage();
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  const cols = Math.floor(img.width / T);
  const rows = Math.floor(img.height / T);
  const insets = [];
  for (let i = 0; i < cols * rows; i++) {
    const x0 = (i % cols) * T;
    const y0 = Math.floor(i / cols) * T;
    let inset = T;
    for (let y = 0; y < T && inset === T; y++) {
      for (let x = 0; x < T; x++) {
        if (data[((y0 + y) * img.width + x0 + x) * 4 + 3] > 40) {
          inset = y;
          break;
        }
      }
    }
    insets.push(inset);
  }
  return insets;
}

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

// Taistelu
const PUNCH_RANGE = 62; // lyönnin ulottuvuus vartalon reunasta
const PUNCH_HIT_FRAME = 4; // lyönnin osumaruutu (0–9)
const STOMP_DAMAGE = 2; // päälle hyppy tekee enemmän vahinkoa kuin lyönti
const STOMP_BOUNCE = -620;
const INVULNERABLE_MS = 1200; // osuman jälkeen hetki suojassa, ettei sama zombi osu heti uudelleen
const STUN_MS = 350; // osuman jälkeen ohjaus palaa pienen hetken päästä
// Zombin hyökkäyshuuto kuuluu enintään näin usein, vaikka moni zombi huomaisi pelaajan
const ALERT_GAP_MS = 4000;

// Aiemmista maailmoista kertyneet tiedot; ensimmäisessä maailmassa kaikki nollassa
export const NEW_RUN = { hp: MAX_HP, orbs: 0, kills: 0, time: 0, totalOrbs: 0, totalZombies: 0 };

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('level');
  }

  // data: { world: maailman järjestysnumero, carry: aiemmista maailmoista kertyneet tiedot }
  init(data) {
    this.worldIndex = data?.world ?? 0;
    this.world = WORLDS[this.worldIndex];
    this.carry = data?.carry ?? NEW_RUN;
  }

  preload() {
    const w = this.world;
    this.load.tilemapTiledJSON(w.key, w.map);
    this.load.image(`tiles-${w.tileset.name}`, w.tileset.file);
    this.load.spritesheet('pelaaja', PLAYER_SHEET.file, {
      frameWidth: PLAYER_SHEET.frameWidth,
      frameHeight: PLAYER_SHEET.frameHeight,
    });
    preloadZombies(this);
  }

  create() {
    const w = this.world;
    this.controls = this.registry.get('controls');
    this.updateSkyline = createSkyline(this, w.skyline);

    // ── Kartta: Tausta ja Maasto pelaajan takana, Edusta edessä ──
    const map = this.make.tilemap({ key: w.key });
    const tiles = map.addTilesetImage(w.tileset.name, `tiles-${w.tileset.name}`);
    const back = map.createLayer('Tausta', tiles).setDepth(1);
    const ground = map.createLayer('Maasto', tiles).setDepth(2);
    map.createLayer('Edusta', tiles).setDepth(4);
    this.ground = ground;
    this.back = back;

    // Kaikki Maaston laatat ovat kiinteitä paitsi koristeet
    ground.setCollisionByExclusion([-1, ...NO_COLLIDE]);
    // Taustassa törmäävät vain maa, esteet ja yksisuuntaiset katot/tasot
    back.setCollision([...SOLID, ...ONE_WAY]);
    for (const layer of [ground, back]) {
      layer.forEachTile((tile) => {
        if (ONE_WAY.includes(tile.index)) tile.setCollision(false, false, true, false);
      });
    }

    // Matalat esteet ja tasot: laatta törmää koko korkeudeltaan, mutta esimerkiksi roska-astian
    // kuva alkaa vasta laatan puolivälistä, jolloin pelaaja seisoisi ilmassa. Pelaajalle nämä
    // laatat korvataan kuvan korkuisilla kappaleilla. Zombit käyttävät yhä laattoja, koska ne
    // eivät nouse esteiden päälle. lowered: laatta → kuvan yläreunan tyhjä tila (wallAhead).
    const insets = tileInsets(this, `tiles-${w.tileset.name}`);
    const lowered = new Map();
    this.lowered = lowered;
    const tops = this.physics.add.staticGroup();
    for (const layer of [ground, back]) {
      layer.forEachTile((tile) => {
        const inset = tile.collides ? insets[tile.index - 1] : 0;
        if (!(inset >= MIN_INSET && inset < T)) return;
        lowered.set(tile, inset);
        const top = this.add.zone(tile.pixelX + T / 2, tile.pixelY + inset + (T - inset) / 2, T, T - inset);
        tops.add(top);
        // Samat törmäyssuunnat kuin laatalla: yksisuuntaisen tason läpi voi hypätä alta, eikä
        // vierekkäisten laattojen välinen sauma pysäytä
        const cc = top.body.checkCollision;
        cc.up = tile.collideUp && tile.faceTop;
        cc.down = tile.collideDown && tile.faceBottom;
        cc.left = tile.collideLeft && tile.faceLeft;
        cc.right = tile.collideRight && tile.faceRight;
      });
    }

    this.mapWidth = map.widthInPixels;
    this.mapHeight = map.heightInPixels;
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight + 400);
    this.physics.world.setBoundsCollision(true, true, false, false); // alareuna auki: kuoppaan voi pudota

    // Aloituspiste ja maali Objektit-tasolta (nimet "pelaaja" ja "maali"),
    // muuten oletukset: alku vasemmasta reunasta, maali kartan lopusta
    const objects = map.getObjectLayer('Objektit')?.objects ?? [];
    const spawn = objects.find((o) => o.name === 'pelaaja') ?? { x: 2 * T, y: this.groundY(2) };
    const goal = objects.find((o) => o.name === 'maali');
    this.goalX = goal ? goal.x : this.mapWidth - 4 * T;

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
    p.alive = true;
    this.player = p;
    const notLowered = (_, tile) => !lowered.has(tile);
    this.physics.add.collider(p, ground, null, notLowered);
    this.physics.add.collider(p, back, null, notLowered);
    this.physics.add.collider(p, tops);

    // ── Zombit ──
    createZombieAnims(this);
    this.zombies = this.physics.add.group(ZOMBIE_BODY);
    for (const z of this.zombieSpawns(objects)) {
      this.zombies.add(new Walker(this, z.x, z.y, z.type));
    }
    this.totalZombies = this.zombies.getLength();
    this.physics.add.collider(this.zombies, ground);
    this.physics.add.collider(this.zombies, back);
    // Kosketus ei satuta: zombi satuttaa vain lyömällä. Päälle hyppy kaataa zombin.
    this.physics.add.overlap(p, this.zombies, this.touchZombie, (_, z) => z.state !== 'dead', this);

    // ── Pakoauto viimeisen maailman lopussa: maali on auton ovella ──
    this.car = null;
    if (w.car) {
      const col = this.ground.layer.width - 9;
      this.car = new Car(this, col * T, this.groundY(col) ?? 10 * T);
      this.goalX = this.car.doorX;
    }

    // ── Valopallot: vain maalin tällä puolen, muuten pallo jää saamatta ──
    const orbs = createOrbs(this, objects, w.itemRow, this.goalX - T / 2);
    this.totalOrbs = orbs.total;
    this.physics.add.overlap(p, orbs.group, (_, orb) => {
      collectOrb(this, orb);
      play('collect', { volume: 0.5 });
      this.orbs += 1;
      this.sendHud(true);
    });

    // ── Energiapakkaukset: +1 energia. Täydellä energialla pakkaus jää odottamaan. ──
    const packs = createEnergyPacks(this, objects, w.energy, w.itemRow);
    this.physics.add.overlap(
      p,
      packs,
      (_, pack) => {
        collectPack(this, pack);
        this.hp += 1;
        this.sendHud(true);
      },
      () => p.alive && this.hp < MAX_HP,
    );

    // ── Metron juna ──
    this.train = w.train ? new Train(this) : null;

    // ── Kamera seuraa pelaajaa, katsoo hieman eteenpäin ──
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.mapWidth, this.mapHeight);
    cam.startFollow(p, true, 0.12, 0.12);
    cam.setFollowOffset(-120, 0);
    cam.setDeadzone(80, 200);
    cam.setRoundPixels(true);
    cam.fadeIn(500, 5, 3, 15);

    // ── Näppäimet: kuunnellaan window-tasolla (Phaserin oletus), Esc jää modaalille ──
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard.addKeys({
      left: K.LEFT, a: K.A, right: K.RIGHT, d: K.D,
      up: K.UP, w: K.W, space: K.SPACE, x: K.X, k: K.K,
    });

    // Energia jatkuu edellisestä maailmasta; pisteet ja aika lasketaan summary()-funktiossa
    this.hp = this.carry.hp;
    this.orbs = 0;
    this.kills = 0;
    this.lastGround = 0;
    this.jumpPressedAt = -Infinity;
    this.prevJump = false;
    this.prevAttack = false;
    this.attacking = false;
    this.punchDone = false;
    this.invulnerableUntil = 0;
    this.stunnedUntil = 0;
    this.safe = { x: spawn.x, y: spawn.y };
    this.elapsed = 0; // pelattu aika ruutujen kestoista, ei kellonajasta
    this.finished = false;
    this.lastHud = 0;
    this.lastAlert = -Infinity;
    this.stopAlert = null; // soivan huudon hiljennys (maalissa); edellisen maailman huuto ei kuulu tähän

    p.on('animationcomplete-attack', () => {
      this.attacking = false;
    });
    // Lyönti osuu vasta, kun nyrkki on edessä (osumaruutu), ja vain kerran
    p.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim, frame) => {
      if (anim.key === 'attack' && !this.punchDone && frame.index - 1 >= PUNCH_HIT_FRAME) {
        this.punchDone = true;
        this.punch();
      }
    });

    // Pelinäkymä fokusoituu modaalissa; jos ikkuna menettää fokuksen, painetut näppäimet nollataan
    this.game.events.on(Phaser.Core.Events.BLUR, this.releaseKeys, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.releaseKeys, this);
    });

    this.sendHud(true);
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

  // Sarakkeen maanpinta (rivit 9–11): kaupungissa katu rivillä 10, metrossa laituri
  // rivillä 10 ja raiteet rivillä 11. Palauttaa pinnan y-koordinaatin tai null.
  groundY(col) {
    for (let row = 9; row < 12; row++) {
      const t = this.ground.getTileAt(col, row);
      if (t && GROUND.includes(t.index)) return row * T;
    }
    return null;
  }

  // Zombien paikat Tiledistä tai maailman listasta. Paikka siirretään oikealle,
  // jos sarakkeessa on kuoppa tai este, jottei zombi synny niiden sisään.
  zombieSpawns(objects) {
    const fromMap = objects.filter((o) => o.name === 'zombi');
    if (fromMap.length) {
      return fromMap.map((o, i) => ({ x: o.x, y: o.y, type: ZOMBIE_TYPES[i % ZOMBIE_TYPES.length] }));
    }
    return this.world.zombies
      .map(([col, type]) => {
        for (let c = col; c < col + 6; c++) {
          const y = this.groundY(c);
          if (y !== null && !this.ground.getTileAt(c, y / T - 1)) return { x: c * T + T / 2, y, type };
        }
        return null;
      })
      .filter(Boolean);
  }

  // Zombi huomasi pelaajan (enemies.js). Huuto vain välillä, ettei se soi jatkuvasti.
  // Maalin jälkeen ei huudeta: zombit päivittyvät yhä, vaikka pelaaja on jo autossa.
  zombieAlert(kid = false) {
    if (!this.player.alive || this.finished || this.elapsed - this.lastAlert < ALERT_GAP_MS) return;
    this.lastAlert = this.elapsed;
    this.stopAlert = play('zombieAttack', { volume: 0.5, rate: kid ? 1.3 : 1 });
  }

  releaseKeys() {
    this.input.keyboard.resetKeys();
    Object.keys(this.controls).forEach((k) => {
      this.controls[k] = false;
    });
  }

  // HUD päivitetään kymmenen kertaa sekunnissa tai heti, kun jokin muuttuu
  sendHud(now = false) {
    if (!now && this.elapsed - this.lastHud < 100) return;
    this.lastHud = this.elapsed;
    this.game.events.emit('zr-hud', this.summary());
  }

  // Koko pelin tiedot: aiempien maailmojen summat + tämän maailman tilanne
  summary() {
    const c = this.carry;
    return {
      world: this.worldIndex,
      worldName: this.world.name,
      lastWorld: this.worldIndex === WORLDS.length - 1,
      hp: this.hp,
      time: c.time + this.elapsed,
      orbs: c.orbs + this.orbs,
      totalOrbs: c.totalOrbs + this.totalOrbs,
      kills: c.kills + this.kills,
      totalZombies: c.totalZombies + this.totalZombies,
    };
  }

  touchZombie(player, zombie) {
    // Päälle hyppy: pelaaja tulee alaspäin ja jalat ovat zombin pään korkeudella
    const pb = player.body;
    if (player.alive && pb.velocity.y > 60 && pb.bottom - zombie.body.top < 26) {
      pb.setVelocityY(STOMP_BOUNCE);
      this.lastGround = -Infinity;
      if (zombie.hurt(STOMP_DAMAGE, player.x)) this.zombieKilled(zombie);
    }
  }

  punch() {
    const pb = this.player.body;
    const dir = this.player.flipX ? -1 : 1;
    const left = dir > 0 ? pb.right : pb.left - PUNCH_RANGE;
    const hitbox = new Phaser.Geom.Rectangle(left, pb.top, PUNCH_RANGE, pb.height);
    for (const z of this.zombies.getChildren()) {
      if (z.state === 'dead') continue;
      const zb = z.body;
      const zr = new Phaser.Geom.Rectangle(zb.left, zb.top, zb.width, zb.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, zr) && z.hurt(1, this.player.x)) {
        this.zombieKilled(z);
      }
    }
  }

  // Lapsizombin äänet soitetaan nopeammin, jolloin ne ovat kimeämpiä
  zombieKilled(zombie) {
    play('zombieDie', { rate: zombie?.kid ? 1.3 : 1 });
    this.kills += 1;
    this.sendHud(true);
  }

  // Zombin lyönti, juna tai kuoppaan putoaminen vie yhden energian.
  // source: osuja (tönäisyn suunta), knock: tönäisyn voimakkuus (juna heittää kauemmas)
  hurtPlayer(source, knock = { knockX: 260, knockY: -380 }) {
    const p = this.player;
    if (!p.alive || this.finished || this.elapsed < this.invulnerableUntil) return;
    this.hp -= 1;
    this.invulnerableUntil = this.elapsed + INVULNERABLE_MS;
    this.attacking = false;
    this.cameras.main.shake(140, 0.006);
    this.sendHud(true);
    if (this.hp <= 0) {
      this.die();
      return;
    }
    play('hurt');
    if (source) {
      // Tönäisy poispäin osujasta; junan voima on etumerkillinen (juna kulkee vasemmalle)
      const away = p.x < source.x ? -1 : 1;
      const vx = knock.knockX < 0 ? knock.knockX : away * knock.knockX;
      this.stunnedUntil = this.elapsed + STUN_MS;
      p.body.setVelocity(vx, knock.knockY);
      p.play('hurt');
    }
    // Vilkkuu suoja-ajan
    this.tweens.add({ targets: p, alpha: 0.35, duration: 100, yoyo: true, repeat: 5, onComplete: () => p.setAlpha(1) });
  }

  die() {
    const p = this.player;
    p.alive = false;
    p.setAlpha(1);
    p.body.setVelocityX(0);
    p.play('dead');
    // Kaatuminen: sama osumaääni matalampana ja hitaampana
    play('hurt', { rate: 0.75 });
    p.once('animationcomplete-dead', () => {
      this.time.delayedCall(500, () => this.game.events.emit('zr-dead', this.summary()));
    });
  }

  update(time, delta) {
    this.updateSkyline(this.cameras.main);
    // Kopio listasta: kuoppaan pudonnut zombi poistuu kesken kierroksen
    for (const z of [...this.zombies.getChildren()]) z.update(time);
    if (this.finished || !this.player.alive) return;
    this.elapsed += delta;
    this.train?.update(this.elapsed, delta);

    const p = this.player;
    const body = p.body;
    const k = this.keys;
    const c = this.controls;
    const stunned = this.elapsed < this.stunnedUntil;
    const left = !stunned && (k.left.isDown || k.a.isDown || c.left);
    const right = !stunned && (k.right.isDown || k.d.isDown || c.right);
    const jump = k.up.isDown || k.w.isDown || k.space.isDown || c.jump;
    const attack = k.x.isDown || k.k.isDown || c.attack;
    // blocked: laatta alla, touching: matala este tai taso alla (kappale, ei laatta)
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      this.lastGround = time;
      // Turvallinen kohta putoamisen jälkeen: viimeisin paikka, jossa seistiin
      this.safe.x = p.x;
      this.safe.y = p.y;
    }

    // Hyppy: painallus muistetaan hetken ja reunalta saa hypätä vielä hetken pudottuaan
    if (jump && !this.prevJump) this.jumpPressedAt = time;
    if (!stunned && time - this.jumpPressedAt < BUFFER_MS && time - this.lastGround < COYOTE_MS) {
      body.setVelocityY(JUMP_VELOCITY);
      this.jumpPressedAt = -Infinity;
      this.lastGround = -Infinity;
    }
    // Lyhyt painallus = matala hyppy
    if (!jump && body.velocity.y < JUMP_VELOCITY * 0.45) {
      body.setVelocityY(JUMP_VELOCITY * 0.45);
    }
    this.prevJump = jump;

    // Lyönti: osuma tarkistetaan animaation osumaruudulla (punch)
    if (attack && !this.prevAttack && !this.attacking && !stunned && onGround) {
      this.attacking = true;
      this.punchDone = false;
      p.play('attack');
      play('punch', { volume: 0.55 });
    }
    this.prevAttack = attack;

    // Seinää päin ei kiihdytetä: muuten törmäys työntää hahmoa takaisin joka ruudulla
    // ja animaatio vaihtelee juoksun ja seisonnan välillä, jolloin hahmo tärisee
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const blocked = dir !== 0 && this.wallAhead(dir);
    const moving = dir !== 0 && !blocked && !this.attacking;

    // Vauhti kiihtyy ja hidastuu pehmeästi. Tönäisyn aikana vauhtiin ei kosketa.
    if (!stunned) {
      const target = moving ? dir * RUN_SPEED : 0;
      const accel = (onGround ? ACCEL_GROUND : ACCEL_AIR) * (delta / 1000);
      const vx = blocked ? 0 : body.velocity.x;
      body.setVelocityX(vx < target ? Math.min(vx + accel, target) : Math.max(vx - accel, target));
      if (dir !== 0) p.setFlipX(dir < 0);
    }

    // Animaatio painetun suunnan mukaan, ei nopeuden: törmäyksen pienet heilahdukset eivät vaihda sitä
    if (!this.attacking && !stunned) {
      if (!onGround) {
        p.anims.stop();
        p.setFrame(JUMP_FRAME);
      } else if (moving) {
        p.play('run', true);
      } else {
        p.play('idle', true);
      }
    }

    // Kuoppaan pudonnut menettää energiaa ja palaa viimeisimmälle turvalliselle paikalle
    if (p.y > this.mapHeight + 150) this.respawn();

    // Maali
    if (p.x >= this.goalX) {
      this.finish();
      return;
    }

    this.sendHud();
  }

  // Onko kulkusuunnassa heti vartalon vieressä seinä? Katsotaan laatat suoraan eikä
  // body.blocked-tietoa, joka vaihtelee ruudusta toiseen, kun hahmo nojaa seinään.
  // Matalan esteen laatassa seinää on vasta kuvan yläreunasta alaspäin: esteen päällä
  // seisovan jalat ovat laatan yläosassa, eikä viereinen este saa pysäyttää kävelyä.
  wallAhead(dir) {
    const b = this.player.body;
    const x = dir > 0 ? b.right + 1 : b.left - 1;
    return [b.top + 4, b.center.y, b.bottom - 4].some((y) => {
      const tile = this.ground.getTileAtWorldXY(x, y) ?? this.back.getTileAtWorldXY(x, y);
      if (!tile?.collides || y < tile.pixelY + (this.lowered.get(tile) ?? 0)) return false;
      return dir > 0 ? tile.collideLeft : tile.collideRight;
    });
  }

  respawn() {
    const p = this.player;
    // Siirretään hieman taaksepäin reunalta, jos siellä on maata
    const back = p.flipX ? 48 : -48;
    const tileBelow = this.ground.getTileAtWorldXY(this.safe.x + back, this.safe.y + 8);
    const x = tileBelow?.collides ? this.safe.x + back : this.safe.x;
    p.body.reset(x, this.safe.y);
    p.setVelocity(0, 0);
    this.cameras.main.flash(250, 255, 61, 200);
    this.invulnerableUntil = 0; // putoaminen vie energian aina, vaikka suoja-aika olisi päällä
    this.hurtPlayer(null);
  }

  finish() {
    this.finished = true;
    // Juuri ennen maalia alkanut huuto hiljennetään, ettei se kuulu autossa tai välianimaatiossa
    this.stopAlert?.(0.3);
    const p = this.player;
    // Osuman vilkkuminen pois: sen lopussa hahmo palautuisi näkyviin, vaikka se on jo autossa
    this.tweens.killTweensOf(p);
    p.setAlpha(1);
    p.body.setVelocity(0, 0);
    p.body.setAllowGravity(false);
    p.play('idle', true);
    this.sendHud(true);
    const done = () => this.game.events.emit('zr-finish', this.summary());
    // Viimeisessä maailmassa pelaaja pakenee autolla ennen loppuruutua
    if (this.car) this.car.drive(p, done);
    else done();
  }
}