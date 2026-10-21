import * as Phaser from 'phaser';
import { play } from './sound.js';

// Metron juna: kiitää raiteilla kameran läpi oikealta vasemmalle. Ennen junaa tunnelin
// päässä vilkkuu varoitus ja maa jyrisee, jolloin pelaaja ehtii nousta laiturille tai
// huoltotasolle. Juna osuu vain raiteiden tasolla oleviin: laiturilla ja tasoilla on turvassa.

const KEY = 'zr-train';
const CAR_W = 384; // yksi vaunu
const CARS = 3;
const H = 120;
const SPEED = 1400;
const FIRST_DELAY = 7000; // ensimmäinen juna vasta, kun pelaaja on ehtinyt tutustua asemaan
const INTERVAL = [9000, 13000]; // satunnainen väli junien välillä (ms)
const WARNING_MS = 1800;
const SOUND_S = 4; // junan äänestä soitetaan alusta näin monta sekuntia
// Raiteiden pinta on rivin 11 yläreunassa; tätä alempana seisova on junan tiellä
const RAIL_TOP = 11 * 64;
const DANGER_Y = RAIL_TOP - 24;

function drawCar(scene) {
  if (scene.textures.exists(KEY)) return;
  const css = getComputedStyle(document.documentElement);
  const cyan = css.getPropertyValue('--cyan').trim() || '#29e0ff';
  const magenta = css.getPropertyValue('--magenta').trim() || '#ff3dc8';
  const tex = scene.textures.createCanvas(KEY, CAR_W * CARS, H);
  const ctx = tex.getContext();

  for (let i = 0; i < CARS; i++) {
    const x = i * CAR_W + 6;
    const w = CAR_W - 12;
    // Runko
    const body = ctx.createLinearGradient(0, 0, 0, H);
    body.addColorStop(0, '#3a4670');
    body.addColorStop(1, '#1a2140');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(x, 8, w, H - 20, i === 0 ? [40, 8, 8, 8] : 8);
    ctx.fill();
    // Ikkunarivi valaistuna
    ctx.fillStyle = cyan;
    ctx.globalAlpha = 0.75;
    for (let wx = x + 40; wx < x + w - 50; wx += 56) ctx.fillRect(wx, 26, 40, 30);
    ctx.globalAlpha = 1;
    // Magenta raita ja ovet
    ctx.fillStyle = magenta;
    ctx.fillRect(x, 66, w, 5);
    ctx.fillStyle = '#10142a';
    ctx.fillRect(x + w / 2 - 22, 22, 44, H - 38);
    // Pyörät
    ctx.fillStyle = '#0a0818';
    for (const px of [x + 40, x + 90, x + w - 90, x + w - 40]) {
      ctx.beginPath();
      ctx.arc(px, H - 12, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Etuvalot ensimmäisen vaunun keulassa (juna kulkee vasemmalle)
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 16;
  ctx.fillRect(12, 70, 14, 10);
  ctx.shadowBlur = 0;
  tex.refresh();
}

export default class Train {
  constructor(scene) {
    this.scene = scene;
    drawCar(scene);
    this.sprite = scene.add.image(0, RAIL_TOP + 6, KEY).setOrigin(0, 1).setDepth(1.5).setVisible(false);
    // Varoitusvalo kameran oikeassa reunassa, raiteiden korkeudella
    this.light = scene.add.circle(0, RAIL_TOP - 60, 26, 0xffc23d).setDepth(5).setScrollFactor(0).setVisible(false);
    this.light.setBlendMode(Phaser.BlendModes.ADD);
    this.nextAt = FIRST_DELAY;
    this.state = 'idle';
  }

  scheduleNext(now) {
    this.nextAt = now + Phaser.Math.Between(INTERVAL[0], INTERVAL[1]);
    this.state = 'idle';
  }

  // now: pelattu aika (LevelScene.elapsed), jotta juna pysähtyy pelin pysähtyessä
  update(now, delta) {
    const { scene } = this;
    const cam = scene.cameras.main;

    if (this.state === 'idle' && now >= this.nextAt) {
      this.state = 'warning';
      this.warnUntil = now + WARNING_MS;
      this.light.setPosition(scene.scale.width - 40, RAIL_TOP - 60 - cam.scrollY).setVisible(true);
      scene.tweens.add({ targets: this.light, alpha: 0.2, duration: 160, yoyo: true, repeat: -1 });
      cam.shake(WARNING_MS, 0.002);
      // Ääni alkaa varoituksesta ja kestää ohituksen yli; loppu häivytetään
      play('train', { volume: 0.6, duration: SOUND_S });
      scene.game.events.emit('zr-train', true);
    }

    if (this.state === 'warning' && now >= this.warnUntil) {
      this.state = 'running';
      scene.tweens.killTweensOf(this.light);
      this.light.setVisible(false);
      this.sprite.setX(cam.scrollX + scene.scale.width + 60).setVisible(true);
      this.hitPlayer = false;
      cam.shake(600, 0.006);
    }

    if (this.state === 'running') {
      this.sprite.x -= SPEED * (delta / 1000);
      this.hitCheck();
      if (this.sprite.x + this.sprite.width < cam.scrollX - 60) {
        this.sprite.setVisible(false);
        scene.game.events.emit('zr-train', false);
        this.scheduleNext(now);
      }
    }
  }

  hitCheck() {
    const left = this.sprite.x;
    const right = left + this.sprite.width;
    const inTrain = (body) => body.right > left && body.left < right && body.bottom > DANGER_Y;

    // Pelaajaan juna osuu kerran ohituksen aikana: muuten pitkä juna ehtisi osua
    // uudelleen suoja-ajan päätyttyä
    const p = this.scene.player;
    if (p.alive && !this.hitPlayer && inTrain(p.body)) {
      this.hitPlayer = true;
      this.scene.hurtPlayer(this.sprite, { knockX: -520, knockY: -620 });
    }

    for (const z of this.scene.zombies.getChildren()) {
      if (z.state !== 'dead' && inTrain(z.body) && z.hurt(99, this.sprite.x + this.sprite.width)) {
        this.scene.zombieKilled(z);
      }
    }
  }
}