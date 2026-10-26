import sektori1 from './maps/sektori1.json';

// Sektorit pelijärjestyksessä. Kartta (Tiled) sisältää vain laatat: Tausta, Esteet ja Edusta.
// Viholliset ja tehostimet ovat tässä listoina kuten Z-Runnerin zombit (worlds.js), joten
// niitä ei tarvitse merkitä Tiledissä.
//
// Rivi on Tiledin y-koordinaatti (0 = kartan yläreuna = sektorin loppu), sarake 0–11.
// Peli alkaa kartan alareunasta ja etenee ylöspäin.
// Vihollisen rivi kertoo ajankohdan: rivi 49 heti alussa, rivi 0 juuri ennen pomoa
// (SpaceScene.js). Viholliset tulevat aina ruudun yläreunasta sarakkeensa kohdalta.
// Tehostin on kartalla rivinsä kohdalla ja tulee näkyviin, kun kartta rullaa sinne. Rivit 0–8
// ovat pomon taistelualuetta (kartta pysähtyy niihin), joten tehostimet rivistä 9 alaspäin.
//
// enemies: [rivi, sarake, tyyppi, liike]
//   tyyppi: scout, fighter, bomber, torpedo, frigate, support, battlecruiser
//   liike:  suora, aalto, sukellus, paikallaan
// pickups: [rivi, sarake, tyyppi]   tyyppi: ase, kilpi, energia, pommi
// fleet:   vihollislaivasto (sprites.js), sama kuin sektorin numero
// boss:    pomo, joka saapuu, kun kartta loppuu (boss.js). Sektori on läpäisty, kun se kaatuu.
export const SECTORS = [
  {
    key: 'sektori1',
    name: 'Asteroidikenttä',
    map: sektori1,
    tileset: { name: 'asteroidit', file: '/games/spacedriver/asteroidit.png' },
    fleet: 'laivasto1',
    enemies: [
      [47, 6, 'scout', 'suora'],
      [45, 3, 'scout', 'suora'],
      [45, 8, 'scout', 'suora'],
      [41, 2, 'fighter', 'aalto'],
      [41, 6, 'fighter', 'aalto'],
      [41, 10, 'fighter', 'aalto'],
      [37, 8, 'fighter', 'suora'],
      [35, 4, 'scout', 'sukellus'],
      [35, 7, 'scout', 'sukellus'],
      [31, 6, 'bomber', 'suora'],
      [29, 4, 'scout', 'aalto'],
      [27, 5, 'fighter', 'suora'],
      [27, 6, 'fighter', 'suora'],
      [22, 6, 'torpedo', 'paikallaan'],
      [19, 3, 'fighter', 'aalto'],
      [19, 8, 'fighter', 'aalto'],
      [17, 2, 'scout', 'aalto'],
      [15, 6, 'frigate', 'suora'],
      [13, 9, 'scout', 'aalto'],
      [10, 2, 'scout', 'sukellus'],
      [10, 5, 'scout', 'sukellus'],
      [10, 9, 'scout', 'sukellus'],
      [8, 9, 'support', 'paikallaan'],
      [6, 4, 'bomber', 'aalto'],
      [2, 3, 'fighter', 'suora'],
      [2, 8, 'fighter', 'suora'],
    ],
    // Ensimmäinen pommi vasta kolmanneksen jälkeen ja lisäase puolivälissä (kanjonissa)
    pickups: [
      [31, 6, 'pommi'],
      [25, 5, 'ase'],
      [20, 6, 'energia'],
      [17, 7, 'pommi'],
      [13, 6, 'kilpi'],
      [9, 4, 'energia'],
    ],
    boss: { type: 'battlecruiser', name: 'Raskas risteilijä', hp: 160, points: 5000 },
  },
];