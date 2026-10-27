// Kaupungin talous puhtaina funktioina: rakentaminen, purku ja päivän laskenta.
// Game.jsx käyttää näitä useReducerin kautta; sama koodi ajetaan simuloinnissa, jolla hinnat
// ja tuotot säädetään (tavoite: hyvällä pelillä 1000 asukasta noin 15–20 päivässä).
//
// Päivän lopussa:
//  - sähkö: tuotanto (raatihuone, valokennot valossa, voimalat) vs. kulutus (talot, kaupat)
//  - asukkaat: talo täyttyy, jos sillä on tie ja sähköä riittää; viihtyvyys nopeuttaa
//  - rahat: vero asukkaista, raatihuone, kaupat ja sienitarhat, voimaloiden ylläpito
// Umpikujaa ei tule: raatihuoneen tulo tulee aina ja minkä tahansa rakennuksen voi purkaa.

import { connectedSet, emptyGrid, GOAL, isHome, near, placeError, priceOf, SIZE, touches, chapterOf } from './buildings.js';
import { castShadows, lightAt } from './shadows.js';

export const START_MONEY = 400;
export const TAX = 2; // €/asukas/pv
export const HALL_INCOME = 30;
export const HALL_POWER = 5;
export const CAP = { house: 10, tower: 60 };
export const POWER_USE = { house: 2, tower: 6, shop: 2 };
export const SOLAR_MAX = 6;
export const PLANT_POWER = 30;
export const PLANT_UPKEEP = 10;
export const SHOP_BASE = 10;
export const SHOP_SHARE = 0.15; // osuus kolmen ruudun säteellä asuvista
export const MUSHROOM_MAX = 18;

export function newCity() {
  return {
    grid: emptyGrid(),
    rots: Array(SIZE * SIZE).fill(null),
    res: Array(SIZE * SIZE).fill(0),
    money: START_MONEY,
    day: 1,
    // Saavutettu luku: avatut rakennukset pysyvät, vaikka asukkaita lähtisi
    chapter: 1,
    report: null,
    done: false,
  };
}

export const population = (res) => res.reduce((a, b) => a + b, 0);

// Valon ja varjon osuus päivän aikana: aurinko 12 hetkenä. lit = valokennon valo-osuus,
// shade = sienitarhan varjo-osuus (0–1) ruuduittain.
export function sunShares(grid) {
  const lit = new Map();
  const shade = new Map();
  const N = 12;
  for (let k = 0; k < N; k++) {
    const light = lightAt(((k + 0.5) / N) * 0.5);
    const { shaded } = castShadows(grid, light);
    const bright = light.alpha > 0.05;
    grid.forEach((type, i) => {
      if (type === 'solar' && bright && !shaded.has(i)) lit.set(i, (lit.get(i) ?? 0) + 1 / N);
      if (type === 'mushroom' && (shaded.has(i) || !bright)) shade.set(i, (shade.get(i) ?? 0) + 1 / N);
    });
  }
  return { lit, shade };
}

// Sähköntuotanto ja -kulutus (yhteydessä olevat rakennukset). Näytetään myös HUDissa.
export function power(grid, linked, shares) {
  let prod = HALL_POWER;
  let use = 0;
  grid.forEach((type, i) => {
    if (!linked.has(i)) return;
    if (type === 'solar') prod += SOLAR_MAX * (shares.lit.get(i) ?? 0);
    if (type === 'power') prod += PLANT_POWER;
    use += POWER_USE[type] ?? 0;
  });
  return { prod: Math.round(prod), use };
}

// Kodin kasvu päivässä: perus 2, puisto lähellä +1, nurmi vieressä +1, kauppa lähellä +1,
// voimalan savu −1. Kerrostalo kasvaa nelinkertaisesti.
export function growthOf(grid, i) {
  const x = i % SIZE;
  const y = Math.floor(i / SIZE);
  let g = 2;
  if (near(grid, x, y, 2, ['park'])) g += 1;
  if (touches(grid, x, y, ['grass', 'park'])) g += 1;
  if (near(grid, x, y, 3, ['shop'])) g += 1;
  if (near(grid, x, y, 2, ['power'])) g -= 1;
  return Math.max(0, g) * (grid[i] === 'tower' ? 4 : 1);
}

// Rakenna tai pura. Palauttaa uuden tilan, tai saman, jos ruutuun ei voi rakentaa.
export function build(city, x, y, tool, rot) {
  if (placeError(city.grid, x, y, tool, city.chapter, city.money)) return city;
  const i = y * SIZE + x;
  const grid = [...city.grid];
  const rots = [...city.rots];
  const res = [...city.res];
  let money = city.money;
  if (tool === 'demolish') {
    money += Math.floor(priceOf(grid[i]) / 2);
    grid[i] = null;
    rots[i] = null;
    res[i] = 0;
  } else {
    money -= priceOf(tool);
    grid[i] = tool;
    rots[i] = rot;
    // Kerrostalo korottaa talon: asukkaat jäävät
    if (!isHome(tool)) res[i] = 0;
  }
  return { ...city, grid, rots, res, money };
}

// Päivän laskenta. Palauttaa uuden tilan ja raportin (näytetään HUDissa ja vartijalle).
export function endDay(city) {
  const { grid } = city;
  const linked = connectedSet(grid);
  const shares = sunShares(grid);
  const { prod, use } = power(grid, linked, shares);
  const ratio = use > 0 ? Math.min(1, prod / use) : 1;
  const powered = ratio >= 1;

  const res = [...city.res];
  grid.forEach((type, i) => {
    if (!isHome(type)) return;
    const cap = CAP[type];
    if (!linked.has(i)) res[i] = Math.max(0, res[i] - 1);
    else if (powered) res[i] = Math.min(cap, res[i] + growthOf(grid, i));
    // Sähköpula: asukkaita lähtee hitaasti, mutta talo ei tyhjene kerralla
    else if (ratio < 0.8) res[i] = Math.max(0, res[i] - (type === 'tower' ? 3 : 1));
  });
  const pop = population(res);

  let income = HALL_INCOME + TAX * pop;
  grid.forEach((type, i) => {
    if (!linked.has(i)) return;
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    if (type === 'shop' && ratio >= 0.8) {
      let nearby = 0;
      res.forEach((r, j) => {
        if (r && Math.max(Math.abs((j % SIZE) - x), Math.abs(Math.floor(j / SIZE) - y)) <= 3) nearby += r;
      });
      income += SHOP_BASE + Math.floor(nearby * SHOP_SHARE);
    }
    if (type === 'mushroom') income += Math.round(MUSHROOM_MAX * (shares.shade.get(i) ?? 0));
    if (type === 'power') income -= PLANT_UPKEEP;
  });

  return {
    ...city,
    res,
    money: city.money + income,
    day: city.day + 1,
    chapter: Math.max(city.chapter, chapterOf(pop).n),
    done: city.done || pop >= GOAL,
    report: { day: city.day, income, prod, use, pop, blackout: !powered },
  };
}