import { SPRITE_BASE, sprite } from './sprites.js';

// Pelaajan alus Phaserissa. Void-paketin alus on kerroksina samaan 48 px:n ruutuun:
// moottorin liekki, moottori, ase ja runko. Kerrokset seuraavat runkoa joka ruudulla.
// Pikseligrafiikka näytetään kaksinkertaisena (96 px), kuten tilesetkin on piirretty 2x.

export const SHIP_SCALE = 2;

// Rungon kuva energian mukaan: täysi energia ehjä, viimeisellä energialla pahasti vaurioitunut
const HULLS = ['pelaaja-vaurio3', 'pelaaja-vaurio2', 'pelaaja-vaurio1', 'pelaaja-ehja'];

// Aseen piipunsuut suhteessa aluksen keskipisteeseen (pelin pikseleinä, 2x). Tykki ampuu
// vuorotellen vasemmasta ja oikeasta piipusta: aseen animaation ruudut 1 ja 2 ovat laukaukset.
export const MUZZLES = { 1: { x: -22, y: -30 }, 2: { x: 22, y: -30 } };

// Osuma-alue rungon muotoinen soikio (puolileveys, puolikorkeus): siivenkärjet ja liekki
// eivät osu, jotta kapeista väleistä pääsee läpi ilman, että osuma tuntuu epäreilulta
export const HITBOX = { rx: 20, ry: 30 };

const KEYS = [
  'pelaaja-ehja',
  'pelaaja-vaurio1',
  'pelaaja-vaurio2',
  'pelaaja-vaurio3',
  'pelaaja-moottori',
  'pelaaja-liekki',
  'pelaaja-liekki-teho',
  'pelaaja-ase-tykki',
  'pelaaja-ammus-tykki',
  'pelaaja-kilpi',
];

export function preloadPlayer(scene) {
  for (const key of KEYS) {
    const s = sprite(key);
    scene.load.spritesheet(key, SPRITE_BASE + s.file, { frameWidth: s.w, frameHeight: s.h });
  }
}

// Animaatiot luodaan kerran; scene.restart ei poista niitä
export function createPlayerAnims(scene) {
  const make = (key, sheet, frameRate, repeat = -1) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(sheet), frameRate, repeat });
  };
  make('sd-liekki', 'pelaaja-liekki', 12);
  make('sd-liekki-teho', 'pelaaja-liekki-teho', 14);
  // 7 ruutua, kaksi laukausta kierroksella: 28 ruutua/s = 8 laukausta sekunnissa
  make('sd-tykki', 'pelaaja-ase-tykki', 28);
  make('sd-ammus-tykki', 'pelaaja-ammus-tykki', 12);
  make('sd-kilpi', 'pelaaja-kilpi', 14);
}

export class PlayerShip {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    const add = (key) => scene.add.sprite(x, y, key).setScale(SHIP_SCALE).setDepth(4);
    this.flame = add('pelaaja-liekki').play('sd-liekki');
    this.engine = add('pelaaja-moottori');
    this.weapon = add('pelaaja-ase-tykki');
    this.hull = add('pelaaja-ehja');
    // Kilpi rungon päällä, näkyy vain tehostimen ajan
    this.shield = add('pelaaja-kilpi').setDepth(4.5).setVisible(false);
    this.parts = [this.flame, this.engine, this.weapon, this.hull];
    this.boost = false;
    this.firing = false;
  }

  // Laukaukset tulevat aseen animaation tahdissa, jolloin suuliekki ja ammus näkyvät yhtä aikaa.
  // callback(piippu, x, y): piippu 1 = vasen, 2 = oikea
  onShot(callback) {
    this.weapon.on('animationupdate', (anim, frame) => {
      const muzzle = MUZZLES[frame.index];
      if (muzzle) callback(frame.index, this.x + muzzle.x, this.y + muzzle.y);
    });
  }

  // Ase pyörii vain, kun ampumanappi on pohjassa
  setFiring(on) {
    if (on === this.firing) return;
    this.firing = on;
    if (on) this.weapon.play('sd-tykki');
    else this.stopWeapon();
  }

  setHp(hp) {
    this.hull.setTexture(HULLS[Math.max(0, Math.min(HULLS.length - 1, hp - 2))]);
  }

  // Ylöspäin kiihdyttäessä isompi liekki
  setBoost(on) {
    if (on === this.boost) return;
    this.boost = on;
    this.flame.play(on ? 'sd-liekki-teho' : 'sd-liekki');
  }

  setShield(on) {
    this.shield.setVisible(on).setAlpha(1);
    if (on) this.shield.play('sd-kilpi');
    else this.shield.stop();
  }

  setAlpha(a) {
    this.parts.forEach((p) => p.setAlpha(a));
  }

  setVisible(v) {
    this.parts.forEach((p) => p.setVisible(v));
    if (!v) this.setShield(false);
  }

  stopWeapon() {
    this.firing = false;
    this.weapon.stop();
    this.weapon.setFrame(0);
  }

  sync() {
    this.parts.forEach((p) => p.setPosition(this.x, this.y));
    this.shield.setPosition(this.x, this.y);
  }

  destroy() {
    this.parts.forEach((p) => p.destroy());
    this.shield.destroy();
  }
}