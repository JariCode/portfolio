import * as Phaser from 'phaser';
import { play } from './sound.js';

// Pakoauto viimeisen maailman maalissa: seisoo parkkipaikalla. Kun pelaaja ehtii sen luo,
// pelaaja nousee kyytiin, ajovalot syttyvät ja auto kaasuttaa ulos kuvasta.
// Kuva piirretään koodilla kuten juna, joten kuvatiedostoa ei tarvita.

const KEY = 'zr-car';
const W = 280;
const H = 116;
const DOOR_X = 96; // kuljettajan ovi auton vasemmasta reunasta: pelaajan maali

function drawCar(scene) {
  if (scene.textures.exists(KEY)) return;
  const css = getComputedStyle(document.documentElement);
  const cyan = css.getPropertyValue('--cyan').trim() || '#29e0ff';
  const magenta = css.getPropertyValue('--magenta').trim() || '#ff3dc8';
  const tex = scene.textures.createCanvas(KEY, W, H);
  const ctx = tex.getContext();

  // Kori: matala sedan, keula oikealla
  const body = ctx.createLinearGradient(0, 40, 0, H);
  body.addColorStop(0, '#3a4670');
  body.addColorStop(1, '#1a2140');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(8, 92);
  ctx.lineTo(8, 62);
  ctx.quadraticCurveTo(10, 52, 30, 50);
  ctx.lineTo(70, 48);
  ctx.lineTo(104, 16);
  ctx.lineTo(186, 16);
  ctx.lineTo(220, 48);
  ctx.lineTo(258, 54);
  ctx.quadraticCurveTo(274, 58, 274, 74);
  ctx.lineTo(274, 92);
  ctx.closePath();
  ctx.fill();

  // Ikkunat himmeästi valaistuina ja ovien saumat
  ctx.fillStyle = cyan;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(84, 48);
  ctx.lineTo(110, 24);
  ctx.lineTo(142, 24);
  ctx.lineTo(142, 48);
  ctx.closePath();
  ctx.moveTo(150, 48);
  ctx.lineTo(150, 24);
  ctx.lineTo(182, 24);
  ctx.lineTo(206, 48);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#141a33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(146, 50);
  ctx.lineTo(146, 88);
  ctx.moveTo(80, 50);
  ctx.lineTo(80, 88);
  ctx.stroke();

  // Magenta raita kyljessä ja neonhehku helmassa
  ctx.fillStyle = magenta;
  ctx.fillRect(14, 66, 256, 4);
  ctx.shadowColor = magenta;
  ctx.shadowBlur = 12;
  ctx.fillRect(30, 92, 220, 3);
  ctx.shadowBlur = 0;

  // Takavalo vasemmalla, ajovalo oikealla (syttyy myöhemmin erillisenä valokeilana)
  ctx.fillStyle = magenta;
  ctx.fillRect(8, 58, 6, 12);
  ctx.fillStyle = '#fff';
  ctx.fillRect(264, 60, 10, 8);

  // Renkaat ja vanteet
  for (const x of [62, 214]) {
    ctx.fillStyle = '#0a0818';
    ctx.beginPath();
    ctx.arc(x, 94, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cyan;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, 94, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  tex.refresh();
}

export default class Car {
  // left: auton vasen reuna, groundY: maan pinta (pyörät sen päällä)
  constructor(scene, left, groundY) {
    this.scene = scene;
    drawCar(scene);
    this.sprite = scene.add.image(left, groundY + 2, KEY).setOrigin(0, 1).setDepth(2.5);
    // Ajovalojen keila: näkyy vasta, kun auto käynnistyy
    this.beam = scene.add
      .triangle(left + W - 4, groundY - 46, 0, 0, 420, -70, 420, 60, 0xf1ecff)
      .setOrigin(0, 0)
      .setAlpha(0)
      .setDepth(2.4)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.doorX = left + DOOR_X;
  }

  // Pelaaja nousee kyytiin, valot syttyvät ja auto lähtee. onGone: kun auto on ulkona kuvasta.
  drive(player, onGone) {
    const { scene, sprite, beam } = this;
    scene.cameras.main.stopFollow();
    scene.tweens.add({ targets: player, x: this.doorX + 20, alpha: 0, duration: 300, ease: 'Quad.in' });
    scene.tweens.add({ targets: beam, alpha: 0.28, duration: 120, delay: 450, yoyo: true, repeat: 1, hold: 80 });
    scene.time.delayedCall(450, () => play('car', { volume: 0.55, duration: 2.6 }));
    scene.tweens.add({
      targets: [sprite, beam],
      x: `+=${scene.scale.width + 300}`,
      delay: 1000,
      duration: 1700,
      ease: 'Quad.in',
      onStart: () => beam.setAlpha(0.28),
      onComplete: onGone,
    });
  }
}