// Shadow Builderin tallennukset. Yhteinen aloitusnäkymälle ja pelikentälle.
// localStorage-kutsut ovat try/catchissa: selain voi estää tallennuksen (esim. yksityinen selaus).

import { HALL, SIZE, TOOLS } from './buildings.js';

const SAVE_PREFIX = 'jaricode:shadowbuilder:';
const RECORD_KEY = `${SAVE_PREFIX}ennatys`;
const CITY_KEY = `${SAVE_PREFIX}kaupunki`;

// Ennätys: { days } eli vähiten päiviä 1000 asukkaaseen. Väärän muotoinen tallennus ohitetaan.
export function readRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(RECORD_KEY));
    return Number.isInteger(record?.days) && record.days > 0 ? record : null;
  } catch {
    return null;
  }
}

// Tallennetaan vain, jos päiviä kului vähemmän kuin aiemmin. Palauttaa true, jos ennätys parani.
export function saveRecord(result) {
  const old = readRecord();
  if (old && old.days <= result.days) return false;
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(result));
    return true;
  } catch {
    return false;
  }
}

// ── Keskeneräinen kaupunki ──
// { grid, rots, seen, t }: ruudukko, rakennusten käännöt (null = kääntyy tietä kohti),
// vartijan jo sanomat repliikit ja vuorokauden kohta. Tallennetaan jokaisen rakennuksen
// ja purun jälkeen, joten sivun päivitys ei hävitä mitään.
const TYPES = new Set([...TOOLS.map((t) => t.id), 'hall']);
const HALL_INDEX = HALL.y * SIZE + HALL.x;

// Väärän muotoinen tai muokattu tallennus ohitetaan kokonaan, ettei peli kaadu siihen
function valid(city) {
  if (!city || !Array.isArray(city.grid) || !Array.isArray(city.rots) || !Array.isArray(city.seen)) return false;
  if (city.grid.length !== SIZE * SIZE || city.rots.length !== SIZE * SIZE) return false;
  if (city.grid[HALL_INDEX] !== 'hall') return false;
  const cellsOk = city.grid.every((g, i) => g === null || (TYPES.has(g) && g !== 'demolish' && (g !== 'hall' || i === HALL_INDEX)));
  const rotsOk = city.rots.every((r) => r === null || [0, 1, 2, 3].includes(r));
  const seenOk = city.seen.every((s) => typeof s === 'string');
  return cellsOk && rotsOk && seenOk && typeof city.t === 'number' && city.t >= 0 && city.t < 1;
}

export function readCity() {
  try {
    const city = JSON.parse(localStorage.getItem(CITY_KEY));
    return valid(city) ? city : null;
  } catch {
    return null;
  }
}

export function saveCity(city) {
  try {
    localStorage.setItem(CITY_KEY, JSON.stringify(city));
  } catch {
    // Tallennus estetty: peli jatkuu, kaupunki vain ei säily päivityksen yli
  }
}

export function clearCity() {
  try {
    localStorage.removeItem(CITY_KEY);
  } catch {
    // Tallennus estetty: ei mitään poistettavaa
  }
}

// Rakennusten määrä aloitusnäkymän Jatka-nappiin (tiet ja raatihuone eivät ole rakennuksia)
export const buildingCount = (city) => city.grid.filter((g) => g && g !== 'road' && g !== 'hall').length;

// Tyhjennä tallennukset: poistaa vain tämän pelin avaimet, muiden pelien tallennukset jäävät
export function clearSaves() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(SAVE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Tallennus estetty: ei mitään poistettavaa
  }
}