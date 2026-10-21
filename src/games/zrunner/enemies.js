import * as Phaser from 'phaser';
import { ZOMBIES, ZOMBIE_ANIMS } from './zombies.js';

// Zombit: kävelevät edestakaisin, jahtaavat pelaajaa nähdessään ja lyövät lähietäisyydeltä.
// Ne katsovat maata edestään eivätkä kävele kuoppaan tai seinää päin, vaan kääntyvät
// tai jäävät reunalle odottamaan.

const SCALE = 0.72; // sama kuin pelaajalla, jotta koot vastaavat toisiaan

// Zombiryhmän fysiikka: sama painovoima ja putoamisnopeuden raja kuin pelaajalla
export const ZOMBIE_BODY = { gravityY: 2000, maxVelocityY: 1100 };

// Lajikohtaiset arvot: lapsi on nopeampi mutta kestää vähemmän
const STATS = {
  adult: { hp: 3, walk: 45, run: 115 },
  kid: { hp: 2, walk: 60, run: 145 },
};

const SIGHT_X = 380; // kuinka kaukaa zombi huomaa pelaajan vaakasuunnassa
const SIGHT_Y = 90; // pelaajan pitää olla suunnilleen samalla korkeudella
const REACH = 52; // lyöntietäisyys vartalon reunasta
const ATTACK_COOLDOWN = 1100;
const LOST_MS = 3000; // näin kauan näkymättömissä, niin zombi "unohtaa" pelaajan
const ATTACK_HIT_FRAME = 3; // lyönnin osumaruutu (0–5): osuma tulee vasta, kun käsi on edessä

// Animaatiot luodaan kerran jokaiselle zombilajille: avaimet muotoa "zombi1-walk"
export function createZombieAnims(scene) {
  for (const z of ZOMBIES) {
    for (const a of ZOMBIE_ANIMS) {
      const key = `${z.key}-${a.key}`;
      if (scene.anims.exists(key)) continue;
      const start = a.row * z.sheet.columns;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(z.key, { start, end: start + a.frames - 1 }),
        frameRate: a.frameRate,
        repeat: a.repeat,
      });
    }
  }
}

export function preloadZombies(scene) {
  for (const z of ZOMBIES) {
    scene.load.spritesheet(z.key, z.file, { frameWidth: z.sheet.frameWidth, frameHeight: z.sheet.frameHeight });
  }
}

export class Walker extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const def = ZOMBIES.find((z) => z.key === type) ?? ZOMBIES[0];
    super(scene, x, y, def.key, 0);
    this.def = def;
    this.stats = def.sheet.frameWidth < 150 ? STATS.kid : STATS.adult;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const s = def.sheet;
    this.setOrigin(s.originX, s.originY).setScale(SCALE).setDepth(3);
    this.body.setSize(s.body.width, s.body.height);
    this.body.setOffset(s.body.offsetX, s.body.offsetY);
    // Painovoima ja putoamisnopeus tulevat ryhmän asetuksista (ZOMBIE_BODY), koska
    // ryhmään lisääminen korvaa yksittäisen kappaleen arvot ryhmän oletuksilla

    this.kid = this.stats === STATS.kid;
    this.hp = this.stats.hp;
    this.alerted = false; // huomasiko pelaajan (hyökkäyshuuto)
    this.lostAt = 0;
    this.state = 'patrol';
    this.face(Math.random() < 0.5 ? -1 : 1);
    this.nextAttack = 0;
    this.hitDone = false;
    this.anim('walk');

    // Lyönnin osuma tarkistetaan vasta osumaruudulla, jotta pelaaja ehtii väistää
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim, frame) => {
      if (this.state !== 'attack' || this.hitDone) return;
      if (anim.key.endsWith('-attack') && frame.index - 1 >= ATTACK_HIT_FRAME) {
        this.hitDone = true;
        if (this.inReach(scene.player)) scene.hurtPlayer(this);
      }
    });
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
      if (anim.key.endsWith('-attack') || anim.key.endsWith('-hurt')) this.state = 'patrol';
      if (anim.key.endsWith('-dead')) {
        scene.tweens.add({ targets: this, alpha: 0, delay: 600, duration: 500, onComplete: () => this.destroy() });
      }
    });
  }

  anim(name) {
    this.play(`${this.def.key}-${name}`, true);
  }

  face(dir) {
    this.dir = dir;
    // Kuvassa zombi katsoo oikealle; vasemmalle kulkiessa kuva peilataan
    this.setFlipX(dir < 0);
  }

  // Vartalon reunasta pelaajan reunaan, kun pelaaja on edessä ja samalla korkeudella
  inReach(player) {
    if (!player.alive) return false;
    const pb = player.body;
    const b = this.body;
    const gap = this.dir > 0 ? pb.left - b.right : b.left - pb.right;
    return gap < REACH && gap > -pb.width && Math.abs(pb.bottom - b.bottom) < 60;
  }

  // Maata edessä? Jos ei, edessä on kuoppa tai talon reuna. Myös seinä ja laatikko käännyttävät.
  // distance: kuinka kaukaa vartalon reunasta katsotaan (tönäisyssä kauempaa)
  blockedAhead(dir, distance = 6) {
    const { ground } = this.scene;
    const b = this.body;
    const front = dir > 0 ? b.right + distance : b.left - distance;
    const below = ground.getTileAtWorldXY(front, b.bottom + 8) ?? this.scene.back.getTileAtWorldXY(front, b.bottom + 8);
    const noFloor = !below?.collides;
    const wall = ground.getTileAtWorldXY(front, b.center.y);
    const hitsWall = wall && (dir > 0 ? wall.collideLeft : wall.collideRight);
    return noFloor || hitsWall;
  }

  hurt(damage, fromX) {
    if (this.state === 'dead') return false;
    this.hp -= damage;
    const away = this.x < fromX ? -1 : 1;
    if (this.hp <= 0) {
      this.state = 'dead';
      this.body.setVelocityX(0); // kaatuu paikalleen; LevelScene ohittaa kuolleet osumissa
      this.anim('dead');
      return true;
    }
    this.state = 'hurt';
    this.face(-away);
    // Pieni tönäisy taaksepäin, mutta ei kuoppaan: maata pitää olla tönäisyn matkalla
    this.body.setVelocity(this.blockedAhead(away, 70) ? 0 : away * 160, -200);
    this.anim('hurt');
    this.scene.cameras.main.shake(80, 0.003);
    return false;
  }

  update(time) {
    // Kuoppaan pudonnut zombi (esim. pelaajan tönäisemä) poistuu ja lasketaan kaadetuksi
    if (this.y > this.scene.mapHeight + 150 && this.state !== 'dead') {
      this.state = 'dead';
      this.scene.zombieKilled(this);
      this.destroy();
      return;
    }
    if (this.state === 'dead' || this.state === 'hurt') return;
    const body = this.body;
    const player = this.scene.player;
    if (!body.blocked.down) return; // ilmassa ei ohjata

    if (this.state === 'attack') {
      body.setVelocityX(0);
      return;
    }

    const dx = player.x - this.x;
    const sees = player.alive && Math.abs(dx) < SIGHT_X && Math.abs(player.y - this.y) < SIGHT_Y;

    // Huuto, kun zombi huomaa pelaajan. Uudelleen vasta, kun pelaaja on ollut hetken poissa näkyvistä.
    if (sees) {
      if (!this.alerted) this.scene.zombieAlert(this.kid);
      this.alerted = true;
      this.lostAt = time;
    } else if (time - this.lostAt > LOST_MS) {
      this.alerted = false;
    }

    if (sees) {
      this.face(Math.sign(dx) || this.dir);
      if (this.inReach(player)) {
        body.setVelocityX(0);
        if (time >= this.nextAttack) {
          this.state = 'attack';
          this.hitDone = false;
          this.nextAttack = time + ATTACK_COOLDOWN;
          this.anim('attack');
        } else {
          this.anim('idle');
        }
        return;
      }
      // Jahtaa, mutta jää reunalle odottamaan eikä hyppää kuoppaan
      if (this.blockedAhead(this.dir)) {
        body.setVelocityX(0);
        this.anim('idle');
      } else {
        body.setVelocityX(this.dir * this.stats.run);
        this.anim('run');
      }
      return;
    }

    // Partio: kävelee, kunnes edessä on kuoppa tai este, ja kääntyy
    if (this.blockedAhead(this.dir)) this.face(-this.dir);
    body.setVelocityX(this.dir * this.stats.walk);
    this.anim('walk');
  }
}