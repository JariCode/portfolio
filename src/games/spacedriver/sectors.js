import sektori1 from './maps/sektori1.json';
import sektori2 from './maps/sektori2.json';
import sektori3 from './maps/sektori3.json';

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
//   tyyppi: scout, fighter, bomber, torpedo, frigate, support
//   liike:  suora, aalto, sukellus, paikallaan
// pickups: [rivi, sarake, tyyppi]   tyyppi: ase, kilpi, energia, pommi
//   ase antaa sektorin oman aseen: sektori 2 Salama, sektori 3 Plasma (sektorissa 1 ei asetta)
// fleet:   vihollislaivasto (sprites.js), sama kuin sektorin numero
// boss:    pomo, joka saapuu, kun kartta loppuu (boss.js). Sektori on läpäisty, kun se kaatuu.
//          type: battlecruiser tai dreadnought; rx/ry vain, jos kuva on eri kokoinen.
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
    // Ensimmäinen pommi vasta kolmanneksen jälkeen. Ei asetta: sektorissa 1 lennetään tykillä.
    pickups: [
      [31, 6, 'pommi'],
      [20, 6, 'energia'],
      [17, 7, 'pommi'],
      [13, 6, 'kilpi'],
      [9, 4, 'energia'],
    ],
    boss: { type: 'battlecruiser', name: 'Raskas risteilijä', hp: 160, points: 5000 },
  },
  {
    key: 'sektori2',
    name: 'Aseman raunio',
    map: sektori2,
    tileset: { name: 'asema', file: '/games/spacedriver/asema.png' },
    fleet: 'laivasto2',
    // Kartta: avaruus (rivit 40–49), telakan suu (30–39), käytävän mutka (20–29),
    // reaktorisali (10–19) ja pomoareena (0–9). Kapeissa kohdissa viholliset tulevat aukon
    // kohdalta, ja ne väistävät seiniä kuten sektorissa 1.
    enemies: [
      [48, 4, 'scout', 'suora'],
      [48, 8, 'scout', 'suora'],
      [46, 6, 'fighter', 'suora'],
      [44, 2, 'scout', 'aalto'],
      [44, 9, 'scout', 'aalto'],
      [42, 5, 'bomber', 'suora'],
      [40, 3, 'fighter', 'aalto'],
      [40, 8, 'fighter', 'aalto'],
      [38, 6, 'torpedo', 'paikallaan'],
      [36, 4, 'scout', 'sukellus'],
      [36, 7, 'scout', 'sukellus'],
      [34, 5, 'fighter', 'suora'],
      [34, 6, 'fighter', 'suora'],
      [31, 6, 'support', 'paikallaan'],
      [29, 4, 'scout', 'suora'],
      [29, 7, 'scout', 'suora'],
      [27, 5, 'bomber', 'aalto'],
      [25, 4, 'fighter', 'suora'],
      [25, 7, 'fighter', 'suora'],
      [22, 6, 'frigate', 'suora'],
      [20, 3, 'scout', 'sukellus'],
      [20, 8, 'scout', 'sukellus'],
      [17, 5, 'torpedo', 'paikallaan'],
      [15, 3, 'fighter', 'aalto'],
      [15, 8, 'fighter', 'aalto'],
      [12, 6, 'bomber', 'suora'],
      [10, 2, 'scout', 'sukellus'],
      [10, 6, 'scout', 'sukellus'],
      [10, 9, 'scout', 'sukellus'],
      [7, 4, 'frigate', 'suora'],
      [4, 3, 'fighter', 'suora'],
      [4, 8, 'fighter', 'suora'],
    ],
    // Salama käytävän mutkassa, kilpi reaktorisalissa ennen pomoa
    pickups: [
      [44, 6, 'energia'],
      [34, 5, 'pommi'],
      [27, 7, 'ase'],
      [22, 3, 'energia'],
      [16, 8, 'kilpi'],
      [13, 6, 'pommi'],
      [9, 5, 'energia'],
    ],
    boss: { type: 'battlecruiser', name: 'Rynnäkköristeilijä', hp: 200, points: 6000 },
  },
  {
    key: 'sektori3',
    name: 'Avaruussumu',
    map: sektori3,
    tileset: { name: 'sumu', file: '/games/spacedriver/sumu.png' },
    fleet: 'laivasto3',
    // Kartta: sumun reuna (rivit 40–49), kallioharjanteet (30–39), kaksoiskallion sola (20–29),
    // kristallikenttä energiapalloineen (10–19) ja pomoareena (0–9). Viimeinen sektori on
    // vaikein: enemmän fregatteja ja pommittajia.
    enemies: [
      [48, 3, 'scout', 'suora'],
      [48, 6, 'scout', 'suora'],
      [48, 9, 'scout', 'suora'],
      [46, 4, 'fighter', 'aalto'],
      [46, 8, 'fighter', 'aalto'],
      [44, 6, 'bomber', 'suora'],
      [42, 2, 'scout', 'sukellus'],
      [42, 9, 'scout', 'sukellus'],
      [40, 5, 'frigate', 'suora'],
      [38, 8, 'fighter', 'suora'],
      [38, 9, 'fighter', 'suora'],
      [36, 7, 'torpedo', 'paikallaan'],
      [35, 3, 'scout', 'aalto'],
      [34, 5, 'bomber', 'aalto'],
      [32, 3, 'fighter', 'suora'],
      [32, 5, 'fighter', 'suora'],
      [30, 6, 'support', 'paikallaan'],
      [28, 5, 'scout', 'sukellus'],
      [28, 6, 'scout', 'sukellus'],
      [26, 5, 'fighter', 'suora'],
      [26, 6, 'fighter', 'suora'],
      [24, 6, 'frigate', 'suora'],
      [21, 5, 'bomber', 'suora'],
      [19, 3, 'fighter', 'aalto'],
      [19, 8, 'fighter', 'aalto'],
      [17, 6, 'torpedo', 'paikallaan'],
      [15, 5, 'frigate', 'suora'],
      [13, 2, 'scout', 'sukellus'],
      [13, 5, 'scout', 'sukellus'],
      [13, 9, 'scout', 'sukellus'],
      [11, 8, 'support', 'paikallaan'],
      [8, 4, 'bomber', 'aalto'],
      [6, 3, 'frigate', 'suora'],
      [4, 3, 'fighter', 'suora'],
      [4, 8, 'fighter', 'suora'],
    ],
    // Plasma kallioharjanteiden välissä, kilpi solassa, energiaa ennen pomoa
    pickups: [
      [45, 6, 'energia'],
      [38, 6, 'pommi'],
      [34, 7, 'ase'],
      [25, 5, 'kilpi'],
      [20, 6, 'energia'],
      [13, 7, 'pommi'],
      [9, 6, 'energia'],
    ],
    boss: { type: 'dreadnought', name: 'Lippulaiva', hp: 260, points: 8000, rx: 70, ry: 94 },
  },
];