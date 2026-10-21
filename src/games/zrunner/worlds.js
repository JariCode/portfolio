import maailma1 from './maps/maailma1.json';
import maailma2 from './maps/maailma2.json';

// Maailmat pelijärjestyksessä. Kaikki tilesetit noudattavat samaa laattajärjestystä
// (rivi 1 maa, rivi 2 kuvat 1–3 katot/katokset, rivi 3 kuvat 1–3 tasot jne.), joten
// LevelScenen törmäyssäännöt toimivat jokaisessa maailmassa sellaisenaan.
//
// zombies: [sarake, laji] – zombi syntyy sarakkeen maahan (rivit 9–11)
// energy: sarakkeet, joihin energiapakkaus tulee
// itemRow: ylin rivi, jolta valopalloille ja pakkauksille etsitään pintaa. Metrossa katokset
//          ovat korkealla ja enimmäkseen tavoittamattomissa, joten ne ohitetaan.
// skyline: taustan teema (skyline.js)
// train: metron juna (train.js)
export const WORLDS = [
  {
    key: 'maailma1',
    name: 'Neonkatu',
    map: maailma1,
    tileset: { name: 'kaupunki', file: '/games/zrunner/kaupunki.png' },
    skyline: 'city',
    itemRow: 0,
    zombies: [
      [12, 'zombi1'],
      [28, 'zombi4'],
      [44, 'zombi2'],
      [55, 'zombi3'],
      [70, 'zombi1'],
      [90, 'zombi4'],
      [105, 'zombi2'],
      [127, 'zombi3'],
    ],
    energy: [35, 68, 101],
    train: false,
  },
  {
    key: 'maailma2',
    name: 'Metrotunneli',
    map: maailma2,
    tileset: { name: 'metro', file: '/games/zrunner/metro.png' },
    skyline: 'metro',
    itemRow: 4,
    zombies: [
      [10, 'zombi1'],
      [24, 'zombi4'],
      [34, 'zombi2'],
      [57, 'zombi3'],
      [74, 'zombi1'],
      [94, 'zombi4'],
      [105, 'zombi2'],
      [127, 'zombi3'],
    ],
    energy: [37, 64, 113],
    train: true,
  },
];