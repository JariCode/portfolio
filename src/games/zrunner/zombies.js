// Zombien sprite-arkit (CraftPix: 2D Zombie Free Sprite ja 2D Zombie Kids Free Sprite,
// ks. credits.js). Alkuperäiset ruudut olivat eri kokoisia, joten ne on kohdistettu
// massakeskipisteen ja jalkojen mukaan ja koottu arkeiksi: rivi = animaatio, sarake = ruutu.
// Kuvat: public/games/zrunner/zombi1.png … zombi4.png (eivät repossa).

// originX/originY: jalkojen kohta ruudussa, sprite.setOrigin(originX, originY) asettaa zombin maahan.
// body: törmäyslaatikko vartalon keskiosaan, jotta ojennetut kädet eivät osu liian kaukaa.
const ADULT_SHEET = {
  frameWidth: 179,
  frameHeight: 160,
  columns: 10,
  originX: 0.5251,
  originY: 0.9875,
  body: { width: 40, height: 115, offsetX: 74, offsetY: 43 },
};

// Lapsi on skaalattu noin 3/4 aikuisen korkeudesta, joten ruutu on pienempi
const KID_SHEET = {
  frameWidth: 123,
  frameHeight: 117,
  columns: 10,
  originX: 0.5447,
  originY: 0.9829,
  body: { width: 32, height: 86, offsetX: 51, offsetY: 29 },
};

// Samat animaatiot kaikilla arkeilla. repeat: -1 = toistuu, 0 = kerran
export const ZOMBIE_ANIMS = [
  { key: 'idle', row: 0, frames: 4, frameRate: 6, repeat: -1 },
  { key: 'walk', row: 1, frames: 6, frameRate: 8, repeat: -1 },
  { key: 'run', row: 2, frames: 10, frameRate: 12, repeat: -1 },
  { key: 'attack', row: 3, frames: 6, frameRate: 10, repeat: 0 },
  { key: 'hurt', row: 4, frames: 5, frameRate: 10, repeat: 0 },
  { key: 'dead', row: 5, frames: 8, frameRate: 10, repeat: 0 },
  { key: 'jump', row: 6, frames: 7, frameRate: 10, repeat: 0 },
];

// facing: suunta, johon zombi katsoo kuvassa. Peli peilaa spriten, kun zombi kulkee toiseen suuntaan.
export const ZOMBIES = [
  { key: 'zombi1', file: '/games/zrunner/zombi1.png', sheet: ADULT_SHEET, facing: 'right' },
  { key: 'zombi2', file: '/games/zrunner/zombi2.png', sheet: ADULT_SHEET, facing: 'right' },
  { key: 'zombi3', file: '/games/zrunner/zombi3.png', sheet: ADULT_SHEET, facing: 'right' },
  { key: 'zombi4', file: '/games/zrunner/zombi4.png', sheet: KID_SHEET, facing: 'right' },
];