// Rakennustyypit ja ruudukon perussäännöt. Yksi paikka, josta valikko, piirto, varjot ja
// vartijan repliikit lukevat tiedot. Hinnat, tuotot ja sähkö tulevat vaiheessa 2.

export const SIZE = 10;

// Raatihuone on valmiina keskellä; samassa ruudussa kuin aloitusnäkymän hehkuva keskiruutu
export const HALL = { x: 4, y: 4 };

// height: korkeus ruudun leveyksinä (varjon pituus). key: näppäin valikossa.
// locked: avautuu myöhemmässä luvussa (näytetään valikossa lukittuna).
export const TOOLS = [
  { id: 'road', key: '1', name: 'Tie', info: 'Yhdistää rakennukset raatihuoneeseen', height: 0 },
  { id: 'house', key: '2', name: 'Talo', info: 'Koti asukkaille. Tarvitsee tien.', height: 0.95 },
  { id: 'shop', key: '3', name: 'Kauppa', info: 'Neonkyltti houkuttelee ostajia', height: 0.8 },
  { id: 'solar', key: '4', name: 'Valokenno', info: 'Tuottaa sähköä vain valossa', height: 0.22 },
  { id: 'park', key: '5', name: 'Puisto', info: 'Viihtyvyyttä. Puut heittävät pieniä varjoja.', height: 0.55 },
  { id: 'mushroom', key: '6', name: 'Sienitarha', info: 'Kasvaa vain varjossa', height: 0.3, locked: 'Luku 2' },
  { id: 'power', key: '7', name: 'Voimala', info: 'Sähköä säästä riippumatta', height: 1.3, locked: 'Luku 2' },
  { id: 'demolish', key: 'Delete', name: 'Pura', info: 'Poista rakennus tai tie' },
];

export const HEIGHT = Object.fromEntries(TOOLS.map((t) => [t.id, t.height ?? 0]));
HEIGHT.hall = 1.7;

export const toolById = (id) => TOOLS.find((t) => t.id === id);

// Ruudukko on taulukko SIZE × SIZE: null = tyhjä, muuten rakennuksen id
export function emptyGrid() {
  const grid = Array.from({ length: SIZE * SIZE }, () => null);
  grid[HALL.y * SIZE + HALL.x] = 'hall';
  return grid;
}

export const at = (grid, x, y) => (x < 0 || y < 0 || x >= SIZE || y >= SIZE ? undefined : grid[y * SIZE + x]);

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// Mitkä ruudut ovat yhteydessä raatihuoneeseen: tiet leveyshaulla raatihuoneelta, ja
// rakennus on yhteydessä, jos sen vieressä on yhteydessä oleva tie tai raatihuone itse.
export function connectedSet(grid) {
  const linked = new Set([HALL.y * SIZE + HALL.x]);
  const queue = [[HALL.x, HALL.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      const i = ny * SIZE + nx;
      if (at(grid, nx, ny) === 'road' && !linked.has(i)) {
        linked.add(i);
        queue.push([nx, ny]);
      }
    }
  }
  grid.forEach((type, i) => {
    if (!type || type === 'road' || type === 'hall') return;
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    if (NEIGHBOURS.some(([dx, dy]) => linked.has((y + dy) * SIZE + x + dx) && at(grid, x + dx, y + dy) !== undefined)) {
      linked.add(i);
    }
  });
  return linked;
}

// Tien suunnat piirtoa varten: mihin naapureihin tie jatkuu (tie tai raatihuone)
export function roadLinks(grid, x, y) {
  return NEIGHBOURS.filter(([dx, dy]) => {
    const n = at(grid, x + dx, y + dy);
    return n === 'road' || n === 'hall';
  });
}

// Julkisivun suunnat käännöille 0–3 (sama järjestys kuin Building.jsx:n piirroksissa)
const FACING = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

// Rakennus kääntyy itsestään kohti viereistä tietä tai raatihuonetta. Näkyvät suunnat
// (0 ja 3) ensin, jotta ovi näkyy, kun tie on edessä. Ilman tietä julkisivu kohti katsojaa.
export function autoRot(grid, x, y) {
  const r = [0, 3, 1, 2].find((i) => {
    const n = at(grid, x + FACING[i][0], y + FACING[i][1]);
    return n === 'road' || n === 'hall';
  });
  return r ?? 0;
}

// Tiellä ja raatihuoneella ei ole käännettävää julkisivua
export const rotatable = (type) => Boolean(type) && type !== 'road' && type !== 'hall' && type !== 'demolish';

// Voiko ruutuun rakentaa valitulla työkalulla
export function canPlace(grid, x, y, tool) {
  const here = at(grid, x, y);
  if (here === undefined || !tool || toolById(tool)?.locked) return false;
  if (tool === 'demolish') return Boolean(here) && here !== 'hall';
  return here === null;
}