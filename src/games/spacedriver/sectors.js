import sektori1 from './maps/sektori1.json';

// Sektorit pelijärjestyksessä. Kartta (Tiled) sisältää vain laatat: Tausta, Esteet ja Edusta.
// Viholliset ja tehostimet ovat tässä listoina kuten Z-Runnerin zombit (worlds.js), joten
// niitä ei tarvitse merkitä Tiledissä.
//
// Rivi on Tiledin y-koordinaatti (0 = kartan yläreuna = sektorin loppu), sarake 0–11.
// Peli alkaa kartan alareunasta ja etenee ylöspäin; vihollinen herää, kun sen rivi tulee
// näkyviin ruudun yläreunassa.
//
// enemies: [rivi, sarake, tyyppi, liike]
//   tyyppi: scout, fighter, bomber, torpedo, frigate, support, battlecruiser
//   liike:  suora, aalto, sukellus, paikallaan
// pickups: [rivi, sarake, tyyppi]   tyyppi: ase, kilpi, energia, pommi
// fleet:   vihollislaivasto (sprites.js), sama kuin sektorin numero
export const SECTORS = [
  {
    key: 'sektori1',
    name: 'Asteroidikenttä',
    map: sektori1,
    tileset: { name: 'asteroidit', file: '/games/spacedriver/asteroidit.png' },
    fleet: 'laivasto1',
    enemies: [
      [45, 3, 'scout', 'suora'],
      [45, 8, 'scout', 'suora'],
      [41, 2, 'fighter', 'aalto'],
      [41, 6, 'fighter', 'aalto'],
      [41, 10, 'fighter', 'aalto'],
      [35, 4, 'scout', 'sukellus'],
      [35, 7, 'scout', 'sukellus'],
      [31, 6, 'bomber', 'suora'],
      [27, 5, 'fighter', 'suora'],
      [27, 6, 'fighter', 'suora'],
      [22, 6, 'torpedo', 'paikallaan'],
      [19, 3, 'fighter', 'aalto'],
      [19, 8, 'fighter', 'aalto'],
      [15, 6, 'frigate', 'suora'],
      [10, 2, 'scout', 'sukellus'],
      [10, 5, 'scout', 'sukellus'],
      [10, 9, 'scout', 'sukellus'],
      [8, 9, 'support', 'paikallaan'],
      [6, 4, 'bomber', 'aalto'],
      [2, 3, 'fighter', 'suora'],
      [2, 8, 'fighter', 'suora'],
      [1, 6, 'battlecruiser', 'suora'],
    ],
    pickups: [
      [38, 6, 'ase'],
      [24, 5, 'energia'],
      [11, 6, 'kilpi'],
      [5, 5, 'pommi'],
    ],
  },
];