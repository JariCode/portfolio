// Pelaajahahmon sprite-arkki (CraftPix: Free Medieval Bandit 4-Direction Character Pack,
// hahmo Thug; ks. credits.js). Paketin valmiit 480 px:n ruudut, oikealle katsova versio;
// vasemmalle peli peilaa spriten. Skaalattu 0,4-kertaiseksi, jotta hahmo on zombien kokoinen.
// Kuva: public/games/zrunner/pelaaja.png (ei repossa).

export const PLAYER_SHEET = {
  file: '/games/zrunner/pelaaja.png',
  frameWidth: 192,
  frameHeight: 192,
  columns: 20,
  // Jalkojen kohta ruudussa: sprite.setOrigin(originX, originY). Ruudun alle jää tyhjää,
  // siksi originY ei ole 1.
  originX: 0.4887,
  originY: 0.8125,
  // Törmäyslaatikko: kapeampi kuin hahmo, jotta hypyt ja reunat tuntuvat reiluilta
  body: { width: 37, height: 108, offsetX: 75, offsetY: 48 },
  facing: 'right',
};

// Paketissa ei ole hyppyanimaatiota: ilmassa näytetään yksi juoksuruutu (JUMP_FRAME).
// blink: silmien räpäytys, jota voi näyttää satunnaisesti paikallaan ollessa.
// repeat: -1 = toistuu, 0 = kerran
export const PLAYER_ANIMS = [
  { key: 'idle', row: 0, frames: 16, frameRate: 12, repeat: -1 },
  { key: 'blink', row: 1, frames: 16, frameRate: 12, repeat: 0 },
  { key: 'walk', row: 2, frames: 20, frameRate: 16, repeat: -1 },
  { key: 'run', row: 3, frames: 12, frameRate: 16, repeat: -1 },
  { key: 'attack', row: 4, frames: 10, frameRate: 16, repeat: 0 },
  { key: 'hurt', row: 5, frames: 10, frameRate: 14, repeat: 0 },
  { key: 'dead', row: 6, frames: 10, frameRate: 12, repeat: 0 },
];

// Juoksuruutu, jossa jalat ovat levällään: näytetään hypyn ja putoamisen ajan (rivi 3, ruutu 3)
export const JUMP_FRAME = 3 * 20 + 3;