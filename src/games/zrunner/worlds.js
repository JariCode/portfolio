import maailma1 from './maps/maailma1.json';
import maailma2 from './maps/maailma2.json';
import maailma3 from './maps/maailma3.json';

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
// cutscene: välianimaatio, joka näytetään ennen tätä maailmaa (Game.jsx)
// car: maalissa odottaa auto, jolla pelaaja pakenee (viimeinen maailma)
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
    car: false,
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
    cutscene: 'metro',
    car: false,
  },
  {
    key: 'maailma3',
    name: 'Puisto',
    map: maailma3,
    tileset: { name: 'puisto', file: '/games/zrunner/puisto.png' },
    skyline: 'park',
    itemRow: 0,
    // Viimeinen maailma: enemmän zombeja kuin aiemmissa
    zombies: [
      [9, 'zombi1'],
      [19, 'zombi4'],
      [28, 'zombi2'],
      [36, 'zombi3'],
      [42, 'zombi1'],
      [52, 'zombi4'],
      [56, 'zombi2'],
      [76, 'zombi3'],
      [82, 'zombi1'],
      [95, 'zombi4'],
      [104, 'zombi2'],
      [110, 'zombi3'],
      [116, 'zombi1'],
      [120, 'zombi4'],
    ],
    // Latvuksen päällä, lammen puutasolla ja leikkitelineen huipulla: palkinto kiipeämisestä
    energy: [36, 67, 88],
    train: false,
    cutscene: 'park',
    car: true,
  },
];