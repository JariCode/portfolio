// Rakennustyypit ja ruudukon perussäännöt. Yksi paikka, josta valikko, piirto, varjot,
// talous ja vartijan repliikit lukevat tiedot.

export const SIZE = 10;

// Raatihuone on valmiina keskellä; samassa ruudussa kuin aloitusnäkymän hehkuva keskiruutu
export const HALL = { x: 4, y: 4 };

// Luvut asukasmäärän mukaan: suora jatkumo kylästä suurkaupunkiin. Tavoite on viimeisen loppu.
export const CHAPTERS = [
  { n: 1, name: 'Kylä', from: 0, to: 100 },
  { n: 2, name: 'Kaupunki', from: 100, to: 500 },
  { n: 3, name: 'Suurkaupunki', from: 500, to: 1000 },
];
export const GOAL = 1000;
export const chapterOf = (pop) => CHAPTERS.find((c) => pop < c.to) ?? CHAPTERS[CHAPTERS.length - 1];

// price: hinta. height: korkeus ruudun leveyksinä (varjon pituus). key: näppäin valikossa.
// chapter: luku, jossa rakennus avautuu (valikossa lukittuna siihen asti).
export const TOOLS = [
  { id: 'road', key: '1', name: 'Tie', price: 5, info: 'Rakennukset toimivat vain tien varrella', height: 0 },
  { id: 'grass', key: '2', name: 'Nurmi', price: 5, info: 'Viereinen talo +1 asukas/yö. Päälle saa rakentaa.', height: 0 },
  { id: 'house', key: '3', name: 'Talo', price: 50, info: '10 asukasta, kasvaa 2/yö. Kuluttaa 2 sähköä.', height: 0.95 },
  { id: 'tower', key: '4', name: 'Kerrostalo', price: 150, info: 'Talon päälle: 60 asukasta, 6 sähköä. Puisto 2 ruudun päähän.', height: 2.2, chapter: 2 },
  { id: 'shop', key: '5', name: 'Kauppa', price: 100, info: '10 €/yö + osuus lähiasukkaista. Talot 3 ruudun päässä +1/yö.', height: 0.8 },
  { id: 'solar', key: '6', name: 'Valokenno', price: 60, info: 'Jopa 6 sähköä, riittää noin kahdelle talolle. Ei varjoon.', height: 0.22 },
  { id: 'park', key: '7', name: 'Puisto', price: 40, info: 'Talot 2 ruudun päässä +1/yö, viereiset +2/yö', height: 0.55 },
  { id: 'mushroom', key: '8', name: 'Sienitarha', price: 80, info: 'Jopa 18 €/yö varjossa. Paras korkean talon takana.', height: 0.3, chapter: 2 },
  { id: 'power', key: '9', name: 'Voimala', price: 250, info: '30 sähköä, ylläpito 10 €/yö. Talot 2 ruudun päässä −1/yö.', height: 1.3, chapter: 2 },
  { id: 'demolish', key: 'Delete', name: 'Pura', price: 0, info: 'Puolet hinnasta takaisin' },
];

export const HEIGHT = Object.fromEntries(TOOLS.map((t) => [t.id, t.height ?? 0]));
HEIGHT.hall = 1.7;

export const toolById = (id) => TOOLS.find((t) => t.id === id);
export const priceOf = (id) => toolById(id)?.price ?? 0;
export const unlocked = (id, chapter) => (toolById(id)?.chapter ?? 1) <= chapter;

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

// Onko säteellä r (ruutuina, myös vinottain) jotain annetuista tyypeistä
export function near(grid, x, y, r, types) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if ((dx || dy) && types.includes(at(grid, x + dx, y + dy))) return true;
    }
  }
  return false;
}

// Viereisissä ruuduissa (ei vinottain) jotain annetuista tyypeistä
export const touches = (grid, x, y, types) => NEIGHBOURS.some(([dx, dy]) => types.includes(at(grid, x + dx, y + dy)));

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
    if (!type || type === 'road' || type === 'hall' || type === 'grass') return;
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

// Tiellä, nurmella ja raatihuoneella ei ole käännettävää julkisivua
export const rotatable = (type) => Boolean(type) && !['road', 'grass', 'hall', 'demolish'].includes(type);

// Vaikutusalueet taloihin (economy.js growthOf): säde ruutuina (myös vinottain) ja vaikutus
// kasvuun. Nurmen ja puiston +1 koskee vain viereisiä ruutuja (ei vinottain). Näytetään
// ruudukolla, kun rakennusta esikatsellaan.
export const RANGE = {
  grass: { r: 1, adjacent: true, effect: 1 },
  park: { r: 2, effect: 1 },
  shop: { r: 3, effect: 1 },
  power: { r: 2, effect: -1 },
};

// Asukkaita mahtuu taloon ja kerrostaloon
export const isHome = (type) => type === 'house' || type === 'tower';

// Miksi ruutuun ei voi rakentaa: null = voi, muuten lyhyt syy valikon tietoriville.
// Nurmen päälle saa rakentaa suoraan; kerrostalo korottaa olemassa olevan talon.
export function placeError(grid, x, y, tool, chapter, money) {
  const here = at(grid, x, y);
  const def = toolById(tool);
  if (here === undefined || !def) return 'Ei ruudukolla';
  if (!unlocked(tool, chapter)) return `Avautuu: Luku ${def.chapter}`;
  if (tool === 'demolish') return here && here !== 'hall' ? null : 'Ei purettavaa';
  if (tool === 'tower') {
    if (here !== 'house') return 'Rakennetaan talon päälle';
    if (!near(grid, x, y, 2, ['park'])) return 'Tarvitsee puiston kahden ruudun säteelle';
  } else if (here !== null && !(here === 'grass' && tool !== 'grass')) {
    return 'Ruutu on varattu';
  }
  if (money < def.price) return 'Rahat eivät riitä';
  return null;
}

export const canPlace = (grid, x, y, tool, chapter, money) => placeError(grid, x, y, tool, chapter, money) === null;